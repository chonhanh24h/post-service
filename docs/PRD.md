# PRD: Post Service - Chợ nhanh 24h

## 1. Product Statement
The `post-service` is a core service responsible for managing the entire lifecycle of classified advertisements. This service solves the following problems:
**Storage and Classification:** Manages classified data including titles, descriptions, pricing, images, and status.
**Search Performance:** Provides fast retrieval of classified ads based on categories, locations, and keywords.
**Consistency:** Ensures classified data remains synchronized with user information and product categories across other services.

## 2. Core Features
**CRUD Operations:** Create (post new ads), update, hide/show, and soft-delete classified ads.
**Media Management:** Supports uploading and managing ad images (integration with AWS S3).
**Search & Filter:** * Full-text search for keywords.
    * Filter by Category, Location, Price Range, and Listing Type (Buy/Sell).
**Pagination & Sorting:** Supports pagination and sorting by latest time or price (ascending/descending).
**Status Management:** Manages statuses such as pending approval, published, sold, or expired.
**Analytics:** Tracks view counts and maintains basic interaction history.

## 3. User Flow
The primary user interaction flows for the `post-service` are as follows:

1. **Posting an Ad:**
    * The user clicks "Post Ad" on `web-chonhanh24h` -> API Gateway -> `post-service`.
    * `post-service` validates permissions (via `auth-service`) -> Saves the ad to MongoDB -> Returns success result.

2. **Browsing Listings:**
    * The user visits the homepage or a category page.
    * `web-chonhanh24h` sends a request with query parameters (category, location, page) -> `post-service`.
    * `post-service` queries MongoDB using optimized indexes -> Returns the list of ads.

3. **Viewing Ad Details:**
    * The user clicks on a specific ad.
    * `post-service` increments the view count (asynchronously) and returns the detailed information for that ad.

---

### Implementation Tips (NestJS + MongoDB)
**MongoDB:** Utilize **Compound Indexes** for fields frequently filtered together (e.g., `{ categoryId: 1, locationId: 1, createdAt: -1 }`) to ensure query speed as data scales.
**NestJS:** Use **DTOs (Data Transfer Objects)** and **Validation Pipes** to strictly control input data at the gateway or service level, preventing invalid data from entering the database.
**Event-driven:** When a new ad is created, consider publishing an event (via RabbitMQ/Kafka) so the `user-service` can update the user's ad count accordingly.