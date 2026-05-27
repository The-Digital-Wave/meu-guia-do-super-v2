import pytest
from validate_api_contract import validate_spec

VALID_SPEC = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** -> Returns a list of all layouts.
- **POST /layouts** -> Creates a new layout.
- **DELETE /layouts/:id** -> Destroys layout.

## 2. Shelves

- **GET /shelves** -> List all active shelves.
- **POST /shelves** -> Create a shelf.

## 3. Products

- **GET /products** -> Fetch complete inventory tracking data.
- **POST /products** -> Register an item type.
"""

SPEC_MISSING_PRODUCTS = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** -> Returns a list of all layouts.

## 2. Shelves

- **GET /shelves** -> List all active shelves.
"""

SPEC_MISSING_SHELVES = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** -> Returns a list of all layouts.

## 3. Products

- **GET /products** -> Fetch complete inventory tracking data.
"""

SPEC_ENDPOINT_WITHOUT_DESCRIPTION = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

- **GET /layouts** ->

## 2. Shelves

- **GET /shelves** -> List all active shelves.

## 3. Products

- **GET /products** -> Fetch complete inventory tracking data.
"""

SPEC_NO_ENDPOINTS = """
# API Endpoint Specifications (v1 Contract)

## 1. Layouts

Some prose with no endpoint definitions.

## 2. Shelves

More prose.

## 3. Products

Even more prose.
"""


def test_valid_spec_returns_no_errors():
    # Arrange + Act
    errors = validate_spec(VALID_SPEC)
    # Assert
    assert errors == []


def test_missing_products_section_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_MISSING_PRODUCTS)
    # Assert
    assert any("Products" in e for e in errors)


def test_missing_shelves_section_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_MISSING_SHELVES)
    # Assert
    assert any("Shelves" in e for e in errors)


def test_endpoint_without_description_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_ENDPOINT_WITHOUT_DESCRIPTION)
    # Assert
    assert any("description" in e.lower() and "/layouts" in e for e in errors)


def test_spec_with_no_parseable_endpoints_is_detected():
    # Arrange + Act
    errors = validate_spec(SPEC_NO_ENDPOINTS)
    # Assert
    assert any("No endpoints found" in e for e in errors)
