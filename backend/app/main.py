from datetime import datetime, timezone
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="ESTARA API",
    description="Where Property Meets Intelligence — backend foundation",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

DB_PATH = Path(__file__).resolve().parent / "estara.db"

class Property(BaseModel):
    id: str
    title: str
    city: str
    locality: str
    property_type: str
    listing_type: str
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    area_sqft: int = Field(gt=0)
    price_inr: int = Field(gt=0)
    image_url: str
    description: str
    is_demo: bool = True

class EnquiryCreate(BaseModel):
    property_id: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=100)
    contact: str = Field(min_length=3, max_length=200)
    message: str = Field(default="", max_length=2000)

    @field_validator("name", "contact")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required.")
        return value

    @field_validator("message")
    @classmethod
    def strip_message(cls, value: str) -> str:
        return value.strip()

class EnquiryCreated(BaseModel):
    id: int
    status: str
    message: str

DEMO_PROPERTIES = [
    Property(id="EST-001", title="The Canopy Residences", city="Hyderabad", locality="Kondapur", property_type="Apartment", listing_type="Buy", bedrooms=3, bathrooms=3, area_sqft=1680, price_inr=12400000, image_url="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85", description="A light-filled contemporary residence with generous living spaces.", is_demo=True),
    Property(id="EST-002", title="Sagewood House", city="Hyderabad", locality="Tellapur", property_type="Villa", listing_type="Buy", bedrooms=4, bathrooms=4, area_sqft=2480, price_inr=21800000, image_url="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", description="A calm architectural home framed by landscaped greenery.", is_demo=True),
    Property(id="EST-003", title="The Olive Apartment", city="Hyderabad", locality="Madhapur", property_type="Apartment", listing_type="Rent", bedrooms=2, bathrooms=2, area_sqft=1180, price_inr=38000, image_url="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85", description="A considered modern interior close to major work hubs.", is_demo=True),
    Property(id="EST-004", title="Forest Edge Plot", city="Hyderabad", locality="Mokila", property_type="Plot", listing_type="Buy", bedrooms=0, bathrooms=0, area_sqft=2400, price_inr=6900000, image_url="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85", description="A plotted-land demo listing. Verify title, approvals and site details independently.", is_demo=True),
]


def initialize_database() -> None:
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS enquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id TEXT NOT NULL,
                property_title TEXT NOT NULL,
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                message TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)
        connection.commit()

initialize_database()

@app.get("/")
def root():
    return {"name": "ESTARA API", "tagline": "Where Property Meets Intelligence.", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "estara-api", "version": app.version}

@app.get("/api/properties", response_model=list[Property])
def list_properties(listing_type: str | None = None, location: str | None = None, q: str | None = None):
    results = DEMO_PROPERTIES
    if listing_type:
        normalized = listing_type.strip().lower()
        results = [p for p in results if p.listing_type.lower() == normalized]
    if location:
        needle = location.strip().lower()
        results = [p for p in results if needle in p.locality.lower() or needle in p.city.lower()]
    if q:
        needle = q.strip().lower()
        results = [p for p in results if needle in p.title.lower() or needle in p.city.lower() or needle in p.locality.lower() or needle in p.property_type.lower()]
    return results

@app.get("/api/properties/{property_id}", response_model=Property)
def get_property(property_id: str):
    for item in DEMO_PROPERTIES:
        if item.id == property_id:
            return item
    raise HTTPException(status_code=404, detail="Property not found")

@app.post("/api/enquiries", response_model=EnquiryCreated, status_code=status.HTTP_201_CREATED)
def create_enquiry(enquiry: EnquiryCreate):
    property_item = next((item for item in DEMO_PROPERTIES if item.id == enquiry.property_id), None)
    if property_item is None:
        raise HTTPException(status_code=404, detail="Property not found. Please refresh the listings and try again.")
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        with sqlite3.connect(DB_PATH, timeout=10) as connection:
            cursor = connection.execute(
                "INSERT INTO enquiries (property_id, property_title, name, contact, message, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (property_item.id, property_item.title, enquiry.name, enquiry.contact, enquiry.message, created_at),
            )
            connection.commit()
            enquiry_id = cursor.lastrowid
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail="We could not save the enquiry right now. Please try again.") from exc
    return EnquiryCreated(id=enquiry_id, status="saved", message="Your enquiry was saved successfully.")
