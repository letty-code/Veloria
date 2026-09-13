import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import DateTime, Integer, Numeric, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


# ============================================================
# Environment
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if origin.strip()
]

SESSION_COOKIE_NAME = "veloria_session"
SESSION_DURATION_HOURS = 2
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"


# ============================================================
# FastAPI
# ============================================================

app = FastAPI()


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Models
# ============================================================

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)


class SessionRecord(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    order_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(40), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(40), nullable=False, default="cash")
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    product_id: Mapped[str] = mapped_column(String(64), nullable=False)
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)


# ============================================================
# PostgreSQL
# ============================================================

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# HTTP-only Cookie Authentication
# ============================================================

def get_current_user(
    veloria_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    """Return the authenticated user from an opaque server-side session cookie."""

    if not veloria_session:
        raise HTTPException(status_code=401, detail="Authentication required")

    session_hash = hashlib.sha256(veloria_session.encode("utf-8")).hexdigest()
    session_record = db.get(SessionRecord, session_hash)
    now = datetime.now(timezone.utc)

    if not session_record or session_record.expires_at <= now:
        if session_record:
            db.delete(session_record)
            db.commit()
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user = db.get(User, session_record.user_id)
    if not user:
        db.delete(session_record)
        db.commit()
        raise HTTPException(status_code=401, detail="User not found")

    return user


def create_session(db: Session, user_id: str) -> str:
    session_id = secrets.token_urlsafe(32)
    session_hash = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_DURATION_HOURS)

    db.add(SessionRecord(
        id=session_hash,
        user_id=user_id,
        expires_at=expires_at,
    ))
    db.commit()
    return session_id


def delete_session(db: Session, session_id: str | None) -> None:
    if not session_id:
        return
    session_hash = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
    session_record = db.get(SessionRecord, session_hash)
    if session_record:
        db.delete(session_record)
        db.commit()


def set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
        max_age=SESSION_DURATION_HOURS * 60 * 60,
        path="/",
    )


# ============================================================
# Request Models
# ============================================================

class UserRegister(BaseModel):
    firstName: str = Field(min_length=1, max_length=100)
    lastName: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("firstName", "lastName")
    @classmethod
    def validate_names(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class OrderItemRequest(BaseModel):
    productId: str = Field(min_length=1, max_length=64)
    quantity: int = Field(ge=1, le=99)


class CustomerDetails(BaseModel):
    email: EmailStr
    firstName: str = Field(min_length=1, max_length=100)
    lastName: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=300)
    city: str = Field(min_length=1, max_length=120)
    postalCode: str = Field(min_length=1, max_length=40)
    phone: str = Field(min_length=3, max_length=50)

    @field_validator("firstName", "lastName", "address", "city", "postalCode", "phone")
    @classmethod
    def validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value


class OrderCreate(BaseModel):
    items: list[OrderItemRequest] = Field(min_length=1, max_length=50)
    customer: CustomerDetails
    paymentMethod: str = Field(default="cash", max_length=40)

    @field_validator("paymentMethod")
    @classmethod
    def validate_payment_method(cls, value: str) -> str:
        value = value.strip().lower()
        if value != "cash":
            raise ValueError("Unsupported payment method")
        return value


# ============================================================
# Home
# ============================================================

@app.get("/")
def home():
    return {"message": "Veloria API is running"}


# ============================================================
# Database Test
# ============================================================

@app.get("/database-test")
def database_test(db: Session = Depends(get_db)):
    try:
        db.execute(select(User).limit(1))
        return {"message": "Successfully connected to PostgreSQL!"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")


# ============================================================
# Register
# ============================================================

@app.post("/api/auth/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.email == user.email))

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    user_id = secrets.token_hex(16)
    new_user = User(
        id=user_id,
        first_name=user.firstName,
        last_name=user.lastName,
        email=str(user.email),
        password=hashed_password,
    )

    db.add(new_user)
    db.commit()

    return {
        "message": "Account created successfully",
        "user_id": user_id,
    }


# ============================================================
# Login
# ============================================================

@app.post("/api/auth/login")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.email == user.email))

    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_correct = bcrypt.checkpw(
        user.password.encode("utf-8"),
        existing_user.password.encode("utf-8"),
    )

    if not password_correct:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Remove older sessions for this user, then create one opaque server-side session.
    old_sessions = db.scalars(
        select(SessionRecord).where(SessionRecord.user_id == existing_user.id)
    ).all()
    for old_session in old_sessions:
        db.delete(old_session)
    db.commit()

    session_id = create_session(db, existing_user.id)
    set_session_cookie(response, session_id)

    return {
        "message": "Login successful",
        "user": {
            "id": existing_user.id,
            "firstName": existing_user.first_name,
            "lastName": existing_user.last_name,
            "email": existing_user.email,
        },
    }


# ============================================================
# Product Catalog
# ============================================================

PRODUCT_CATALOG = [
    # id, name, price, category, image
    ("dress-001", "Plum Dress", 7000, "dress", "../Desses/1.png"),
    ("dress-002", "Dusty Rose Dress", 8000, "dress", "../Desses/7.png"),
    ("dress-003", "Mocha Mousse Dress", 9000, "dress", "../Desses/2.png"),
    ("dress-004", "Espresso Dress", 8000, "dress", "../Desses/3.png"),
    ("dress-005", "Burgundy Dress", 9000, "dress", "../Desses/5.png"),
    ("dress-006", "Italian Plum Dress", 8000, "dress", "../Desses/8.png"),
    ("dress-007", "Wine Red Dress", 10000, "dress", "../Desses/1.png"),
    ("dress-008", "Ivory Dress", 10000, "dress", "../Desses/6.png"),
    ("bag-001", "Dusty Rose Bag", 5000, "bag", "../Bags/1.png"),
    ("bag-002", "Mocha Mousse Bag", 6000, "bag", "../Bags/2.png"),
    ("bag-003", "Espresso Bag", 6000, "bag", "../Bags/3.png"),
    ("bag-004", "Burgundy Bag", 7000, "bag", "../Bags/4.png"),
    ("bag-005", "Ivory Bag", 5000, "bag", "../Bags/5.png"),
    ("bag-006", "Italian Plum Bag", 6000, "bag", "../Bags/6.png"),
    ("bag-007", "Cream Bag", 5000, "bag", "../Bags/7.png"),
    ("bag-008", "Black Bag", 5000, "bag", "../Bags/8.png"),
    ("accessories-001", "Necklace", 70000, "accessories", "../Accessories/5.png"),
    ("accessories-002", "Nacklace", 80000, "accessories", "../Accessories/10.png"),
    ("accessories-003", "Ring", 20000, "accessories", "../Accessories/4.png"),
    ("accessories-004", "Bracelet", 50000, "accessories", "../Accessories/7.png"),
    ("accessories-005", "Earrings", 58000, "accessories", "../Accessories/8.png"),
    ("accessories-006", "Earrings", 50000, "accessories", "../Accessories/8.png"),
    ("accessories-007", "Parure", 180000, "accessories", "../Accessories/1.png"),
    ("accessories-008", "Parure", 175000, "accessories", "../Accessories/1.png"),
    ("accessories-009", "Parure", 170000, "accessories", "../Accessories/1.png"),
    ("accessories-010", "Parure", 190000, "accessories", "../Accessories/1.png"),
    ("shoe-001", "Moucha Mousse Shoes", 8000, "shoe", "../Shoes/3.png"),
    ("shoe-002", "Champagne Shoes", 9000, "shoe", "../Shoes/8.png"),
    ("shoe-003", "Plum Shoes", 7000, "shoe", "../Shoes/1.png"),
    ("shoe-004", "Mouve Shoes", 7000, "shoe", "../Shoes/4.png"),
    ("shoe-005", "Plum Shoes", 8000, "shoe", "../Shoes/10.png"),
    ("shoe-006", "Dusty Rose Shoes", 8000, "shoe", "../Shoes/6.png"),
    ("shoe-007", "Espresso Shoes", 9000, "shoe", "../Shoes/7.png"),
    ("shoe-008", "Black Shoes", 7000, "shoe", "../Shoes/2.png"),
    ("shoe-009", "Ivory Shoes", 8000, "shoe", "../Shoes/9.png"),
    ("shoe-010", "Burgundy Shoes", 9000, "shoe", "../Shoes/5.png"),
]


def seed_products(db: Session) -> None:
    existing_ids = set(db.scalars(select(Product.id)).all())
    added = False
    for product_id, name, price, category, image in PRODUCT_CATALOG:
        if product_id not in existing_ids:
            db.add(Product(id=product_id, name=name, price=price, category=category, image=image))
            added = True
    if added:
        db.commit()


with SessionLocal() as _seed_db:
    seed_products(_seed_db)


@app.get("/api/products")
def list_products(search: str | None = None, category: str | None = None, db: Session = Depends(get_db)):
    statement = select(Product).order_by(Product.category, Product.id)
    if search:
        statement = statement.where(Product.name.ilike(f"%{search.strip()}%"))
    if category:
        statement = statement.where(Product.category == category.strip().lower())

    products = db.scalars(statement).all()
    return {
        "products": [
            {
                "id": product.id,
                "name": product.name,
                "price": float(product.price),
                "category": product.category,
                "image": product.image,
            }
            for product in products
        ]
    }


# ============================================================
# Current User
# ============================================================

@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "firstName": current_user.first_name,
        "lastName": current_user.last_name,
        "email": current_user.email,
    }


# ============================================================
# Orders / Checkout
# ============================================================

@app.post("/api/orders")
def create_order(
    order: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not order.items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    if order.paymentMethod != "cash":
        raise HTTPException(status_code=400, detail="Unsupported payment method")

    product_ids = [item.productId for item in order.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(status_code=400, detail="Duplicate products in cart")

    products = db.scalars(select(Product).where(Product.id.in_(product_ids))).all()
    products_by_id = {product.id: product for product in products}

    if len(products_by_id) != len(product_ids):
        raise HTTPException(status_code=400, detail="One or more products do not exist")

    total = 0
    validated_items = []
    for item in order.items:
        if item.quantity < 1 or item.quantity > 99:
            raise HTTPException(status_code=400, detail="Quantity must be between 1 and 99")
        product = products_by_id[item.productId]
        unit_price = float(product.price)
        line_total = unit_price * item.quantity
        total += line_total
        validated_items.append((product, item.quantity, unit_price, line_total))

    # Use the authenticated account as the owner. Do not trust a user id from the browser.
    customer = order.customer
    if str(customer.email).lower() != current_user.email.lower():
        raise HTTPException(status_code=400, detail="Checkout email must match the signed-in account")

    order_id = secrets.token_hex(16)
    order_number = f"VELORIA-{datetime.now().strftime('%Y%m%d')}-{secrets.randbelow(9000) + 1000}"
    while db.scalar(select(Order.id).where(Order.order_number == order_number)):
        order_number = f"VELORIA-{datetime.now().strftime('%Y%m%d')}-{secrets.randbelow(9000) + 1000}"

    new_order = Order(
        id=order_id,
        order_number=order_number,
        user_id=current_user.id,
        email=current_user.email,
        first_name=customer.firstName.strip(),
        last_name=customer.lastName.strip(),
        address=customer.address.strip(),
        city=customer.city.strip(),
        postal_code=customer.postalCode.strip(),
        phone=customer.phone.strip(),
        payment_method=order.paymentMethod,
        total=total,
    )
    db.add(new_order)

    for product, quantity, unit_price, line_total in validated_items:
        db.add(OrderItem(
            order_id=order_id,
            product_id=product.id,
            product_name=product.name,
            unit_price=unit_price,
            quantity=quantity,
            line_total=line_total,
        ))

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to create order")

    return {
        "message": "Order created successfully",
        "order": {
            "id": order_id,
            "orderNumber": order_number,
            "total": total,
            "paymentMethod": order.paymentMethod,
        },
    }


@app.get("/api/orders")
def list_my_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.scalars(
        select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    ).all()
    return {
        "orders": [
            {
                "id": order.id,
                "orderNumber": order.order_number,
                "total": float(order.total),
                "paymentMethod": order.payment_method,
                "createdAt": order.created_at.isoformat(),
            }
            for order in orders
        ]
    }


# ============================================================
# Logout
# ============================================================

@app.post("/api/auth/logout")
def logout(
    response: Response,
    veloria_session: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    delete_session(db, veloria_session)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return {"message": "Logout successful"}
