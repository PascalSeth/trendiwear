# Category, Subcategory & Collection Schema — Analysis & Improvement Guide

> **Created:** 2026-04-09  
> **Status:** Pending Implementation  
> **Schema file:** `prisma/schema.prisma`

---

## Current Structure Overview

| Model | Key Fields | Relationship |
|---|---|---|
| `Category` | `id`, `name`, `slug`, `parentId`, `order` | Self-referencing (Adjacency List) |
| `Collection` | `id`, `name`, `slug`, `categoryId`, `season` | Belongs to one `Category` |
| `Product` | `categoryId`, `collectionId` | Belongs to one `Category`, optional one `Collection` |

---

## What's Working Well ✅

1. **Adjacency List for Subcategories** — `Category.parentId` is a self-referencing FK. This allows unlimited nesting depth without extra tables (e.g. `Men → Shoes → Sneakers → Running`). Correct approach.
2. **Slugs** — Both `Category` and `Collection` have `slug` fields for SEO-friendly URLs.
3. **Display Ordering** — The `order: Int` field exists on both `Category` and `Collection`, enabling manual UI sequence control.

---

## Issues & Bottlenecks ❌

### 1. Collection is Locked to a Single Category
```
Collection.categoryId String  // mandatory
```
**Problem:** A marketing collection like *"Summer Holidays 2024"* must belong to exactly one category. In reality, it should span Shirts, Shorts, Shoes, and Accessories simultaneously. The current design makes cross-category collections impossible.

---

### 2. Product can Only Be in One Collection (1:M)
```
Product.collectionId String?  // optional FK
```
**Problem:** If you have a *"Featured Artisans"* collection AND a *"Black Friday Sale"* collection, a product can only appear in one at a time. This severely limits marketing flexibility.

---

### 3. No `level` Field on Category
**Problem:** To build breadcrumbs like `Home → Women → Dresses → Summer Dresses`, the current schema requires multiple recursive DB queries to traverse the `parentId` chain upward.

---

### 4. Unisex Products Live in One Category Tree Only
```
Product.isUnisex Boolean @default(true)
```
**Problem:** With `categoryId` being a single FK, a unisex bag that belongs in both `Men → Accessories` and `Women → Accessories` can only be in one. The `isUnisex` flag exists but the schema can't express the category cross-over.

---

## Recommended Changes

### Change 1: Decouple `Collection` from `Category`
Remove `categoryId` from `Collection`. Collections become global, platform-wide marketing containers.

```diff
model Collection {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  imageUrl    String?
- categoryId  String                        // REMOVE
  season      Season?
  isActive    Boolean   @default(true)
  isFeatured  Boolean   @default(false)
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
- category    Category  @relation(...)     // REMOVE
  products    Product[]
}
```

Also remove from `Category`:
```diff
model Category {
  // ...
- collections Collection[]                 // REMOVE
}
```

---

### Change 2: Make Product ↔ Collection a Many-to-Many (M:N)
Remove `collectionId` from `Product`. Prisma will automatically create the join table `_CollectionToProduct`.

```diff
model Product {
  // ...
- collectionId  String?                    // REMOVE FK
- collection    Collection? @relation(...) // REMOVE

+ collections   Collection[]               // ADD: M:N implicit relation
}

model Collection {
  // ...
+ products      Product[]                  // Already present — Prisma handles M:N
}
```

**Result:** A product can now belong to `Black Friday Sale`, `Featured Artisans`, *and* `Summer Edit` simultaneously.

---

### Change 3: Add `level` Field to Category
Populate on creation: `0` = root, `1` = department, `2` = sub-department, etc.

```diff
model Category {
  // ...
+ level       Int      @default(0)   // ADD: 0=Root, 1=Department, 2=Sub-dept
}
```

**Usage examples:**
- Navbar mega-menu: `WHERE level = 0` → fetch all top-level categories fast.
- Breadcrumbs: Use `level` to know how deep to recurse.
- Admin UI: Filter categories by depth without traversal.

---

### Change 4 (Optional): Make Product ↔ Category Many-to-Many
Only needed if you want one product to explicitly appear in multiple unrelated category trees (e.g. a unisex product in both `Men > Accessories` and `Women > Accessories`).

```diff
model Product {
  // ...
- categoryId  String                       // REMOVE single FK
- category    Category @relation(...)      // REMOVE

+ categories  Category[]                   // ADD: M:N implicit relation
}
```

> **Note:** With the current approach (single `categoryId` pointing to the deepest node), breadcrumb traversal via the `parentId` chain is standard practice and works well. Only adopt M:N if the business explicitly requires the same product surfacing in two distinct top-level trees.

---

## Final Optimised Schema (Target State)

```prisma
model Category {
  id          String       @id @default(uuid())
  name        String       @unique
  slug        String       @unique
  description String?
  imageUrl    String?
  parentId    String?
  level       Int          @default(0)   // NEW
  isActive    Boolean      @default(true)
  order       Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  parent      Category?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[]   @relation("CategoryHierarchy")
  products    Product[]
  // collections removed
}

model Collection {
  id          String    @id @default(uuid())
  name        String    @unique
  slug        String    @unique
  description String?
  imageUrl    String?
  // categoryId removed
  season      Season?
  isActive    Boolean   @default(true)
  isFeatured  Boolean   @default(false)
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[] // M:N — implicit join table auto-created by Prisma
}

model Product {
  // ... all existing fields ...

  categoryId           String              // Keep: single deepest-node category
  // collectionId removed

  category             Category            @relation(fields: [categoryId], references: [id])
  collections          Collection[]        // NEW: M:N — replaces single collectionId FK
}
```

---

## Implementation Checklist

- [ ] Remove `categoryId` from `Collection` model
- [ ] Remove `collections Collection[]` from `Category` model
- [ ] Remove `collectionId String?` from `Product` model
- [ ] Remove `collection Collection? @relation(...)` from `Product` model
- [ ] Add `collections Collection[]` to `Product` model (M:N)
- [ ] Add `level Int @default(0)` to `Category` model
- [ ] Run `npx prisma migrate dev --name "decouple-collections-m2m"`
- [ ] Update seed data / admin collection management UI to remove category dropdown
- [ ] Update product add/edit form to support multi-collection selection
- [ ] Update API routes: `GET /api/collections` no longer filters by categoryId
- [ ] Update any category queries that joined `collections` to use new product → collections path

---

## Migration Risk Assessment

| Change | Risk | Notes |
|---|---|---|
| Add `level` to Category | 🟢 Low | Additive. Default `0`. Backfill optionally. |
| Decouple Collection from Category | 🟡 Medium | Any UI/API filtering collections by category must be updated. |
| Product → Collections M:N | 🟡 Medium | Existing `collectionId` data must be migrated to the join table before dropping the column. |
| Product → Categories M:N | 🔴 High | Large data migration; recommend only if business needs it. |
