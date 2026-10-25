from pydantic import BaseModel, Field

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
