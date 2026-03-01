# nodekode

> Zero-friction Node.js backend toolkit — error handling, file storage, auth utilities, and helpers in one package.

[![npm version](https://img.shields.io/npm/v/nodekode.svg)](https://www.npmjs.com/package/nodekode)
[![license](https://img.shields.io/npm/l/nodekode.svg)](https://github.com/amirpoudel/nodekode/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/nodekode)](https://www.npmjs.com/package/nodekode)

---

## Why nodekode?

Every Node.js backend project repeats the same boilerplate: structured errors, API response shapes, async wrappers, JWT auth, password hashing, file uploads. `nodekode` ships all of that in a single, tree-shakeable package with **zero mandatory dependencies beyond `winston`**.

- **No bloat** — peer deps are optional. Only install what you use.
- **Sub-path imports** — import only the module you need.
- **Fully typed** — complete TypeScript declarations and source maps included.
- **Drop-in** — works with Express. Compatible with any Node.js ≥ 16 project.

---

## Installation

```bash
npm install nodekode
```

Then install only the peer deps your project actually uses:

```bash
# Express middleware
npm install express

# AWS S3 storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Azure Blob storage
npm install @azure/storage-blob

# JWT auth
npm install jsonwebtoken

# Password hashing
npm install bcrypt
```

---

## Import Paths

| Import path | What it contains |
|---|---|
| `nodekode` | Everything (barrel) |
| `nodekode/error` | `AppError`, `expressErrorHandler`, `createLogger` |
| `nodekode/api` | `ApiResponse`, `ApiError` |
| `nodekode/async` | `asyncHandler`, `trycatchWrapper*` |
| `nodekode/aws` | `S3Storage` |
| `nodekode/azure` | `AzureStorage` |
| `nodekode/auth` | JWT + bcrypt utilities |
| `nodekode/helpers` | Pagination, date, string, object utilities |

---

## Modules

### Error Handling — `nodekode/error`

#### `AppError`

Structured, typed error class. Use static factory methods instead of `new AppError(...)` directly.

```ts
import { AppError } from "nodekode/error";

// HTTP errors
throw AppError.badRequest("Email is required");
throw AppError.notFound("User not found");
throw AppError.unauthorized("Login required");
throw AppError.forbidden("Insufficient permissions");
throw AppError.conflict("Email already registered");
throw AppError.invalidCredentials("Wrong password");
throw AppError.internalServerError("Unexpected failure");

// Validation (Zod)
import { z } from "zod";
const schema = z.object({ email: z.string().email() });
const result = schema.safeParse(body);
if (!result.success) throw AppError.zodError("Validation failed", result.error);

// Database errors
throw AppError.mongoError("DB write failed", mongoErr);   // handles duplicate key (409) automatically
throw AppError.prismaError("DB write failed", prismaErr); // maps P2002, P2025, etc.
```

`AppError` properties:

| Property | Type | Description |
|---|---|---|
| `statusCode` | `number` | HTTP status code |
| `message` | `string` | Human-readable message |
| `error` | `any` | Raw underlying error |
| `errors` | `any[]` | Field-level error array (e.g. Zod issues) |
| `status` | `string` | `"fail"` or `"error"` |
| `isOperational` | `boolean` | Whether this is a handled error |
| `isError` | `boolean` | Always `true` |

---

#### `expressErrorHandler`

Express global error middleware. Register it **last**, after all routes.

```ts
import express from "express";
import { expressErrorHandler } from "nodekode/error";

const app = express();

app.use("/api", routes);

// Must be last
app.use(expressErrorHandler);
```

Error response shape:

```json
{
  "error": {
    "status": 404,
    "data": {
      "message": "User not found",
      "error": "",
      "errors": []
    },
    "isError": true
  }
}
```

---

#### `createLogger`

Winston-based logger factory. Creates a named logger that writes to `logs/error.log`, `logs/info.log`, and the console.

```ts
import { createLogger } from "nodekode/error";

const logger = createLogger("UserService");

logger.info("User created", { userId: "123" });
logger.error("Payment failed", { orderId: "abc", reason: "timeout" });
```

---

### API Shapes — `nodekode/api`

#### `ApiResponse`

Consistent success response wrapper.

```ts
import { ApiResponse } from "nodekode/api";

// In an Express route:
const users = await UserService.findAll();
return res.status(200).json(new ApiResponse(200, users, "Users fetched"));

// Response shape:
// { statusCode: 200, data: [...], message: "Users fetched", success: true, isError: false }
```

#### `ApiError`

Lightweight error class for cases not needing the full `AppError` logic.

```ts
import { ApiError } from "nodekode/api";

throw new ApiError(422, "Unprocessable entity", { field: "email" });
```

---

### Async Wrappers — `nodekode/async`

#### `asyncHandler` — Express route wrapper

Wraps an async Express route handler and forwards thrown errors to `next()` automatically. No more try/catch in every route.

```ts
import { asyncHandler } from "nodekode/async";
import { AppError } from "nodekode/error";

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await UserService.findById(req.params.id);
    if (!user) throw AppError.notFound("User not found");
    res.json(new ApiResponse(200, user));
  })
);
```

---

#### `trycatchWrapper` — Generic async wrapper

Wraps any async function. Re-throws the original error.

```ts
import { trycatchWrapper } from "nodekode/async";

const safeGetUser = trycatchWrapper(async (id: string) => {
  return await db.users.findUnique({ where: { id } });
});

const user = await safeGetUser("user_123");
```

---

#### `trycatchWrapperMongo` — Mongoose error wrapper

Converts Mongoose errors into `AppError.mongoError` automatically (including duplicate key → 409).

```ts
import { trycatchWrapperMongo } from "nodekode/async";

const createUser = trycatchWrapperMongo(async (data: CreateUserDto) => {
  return await UserModel.create(data);
});
```

---

#### `trycatchWrapperPrisma` — Prisma error wrapper

Converts Prisma error codes (P2002, P2025, etc.) into human-readable `AppError` automatically.

```ts
import { trycatchWrapperPrisma } from "nodekode/async";

const createUser = trycatchWrapperPrisma(async (data: CreateUserDto) => {
  return await prisma.user.create({ data });
});
```

---

### AWS S3 Storage — `nodekode/aws`

Pre-signed URL based upload/download. No files are ever routed through your server.

**Required peer deps:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

**Environment variables:**

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=my-bucket
```

```ts
import { S3Storage } from "nodekode/aws";

const storage = new S3Storage();
// or override env vars:
const storage = new S3Storage({
  accessKeyId: "key",
  secretAccessKey: "secret",
  region: "ap-south-1",
  bucketName: "my-bucket",
  expirySeconds: 3600, // default: 7 days
});

// Generate a pre-signed upload URL (PUT)
const uploadUrl = await storage.putObjectUrl("avatars/user-123.png", "image/png");
// → return this URL to the client; client uploads directly to S3

// Generate a pre-signed download URL (GET)
const downloadUrl = await storage.getObjectUrl("avatars/user-123.png");

// Delete objects
await storage.deleteObjects(["avatars/user-123.png", "docs/old.pdf"]);
```

**Typical upload flow:**

```
Client → POST /upload-url → Server returns pre-signed PUT URL
Client → PUT <upload-url> (uploads file directly to S3)
Client → POST /save → Server stores the object key in DB
```

`S3Storage` implements [`IStorageProvider`](#istorageprovider) — you can swap to Azure without changing any other code.

---

### Azure Blob Storage — `nodekode/azure`

SAS token based upload/download.

**Required peer deps:** `@azure/storage-blob`

**Environment variables:**

```env
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=
AZURE_STORAGE_CONTAINER_NAME=uploads
```

```ts
import { AzureStorage } from "nodekode/azure";

const storage = new AzureStorage();
// or override:
const storage = new AzureStorage({
  accountName: "myaccount",
  accountKey: "key==",
  containerName: "uploads",
  expirySeconds: 3600,
});

const uploadUrl  = await storage.putObjectUrl("avatars/user-123.png", "image/png");
const downloadUrl = await storage.getObjectUrl("avatars/user-123.png");
await storage.deleteObjects(["avatars/user-123.png"]);
```

---

#### `IStorageProvider`

Both `S3Storage` and `AzureStorage` implement this interface. Use it to write provider-agnostic service code.

```ts
import type { IStorageProvider } from "nodekode/aws"; // or nodekode/azure

class MediaService {
  constructor(private storage: IStorageProvider) {}

  async getUploadUrl(filename: string, type: string) {
    return this.storage.putObjectUrl(filename, type);
  }
}

// Swap providers without changing MediaService
const service = new MediaService(new S3Storage());
const service = new MediaService(new AzureStorage());
```

---

### Auth — `nodekode/auth`

#### JWT

**Required peer dep:** `jsonwebtoken`

**Environment variables:**

```env
ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

```ts
import {
  generateAccessToken,
  generateRefreshToken,
  generateAccessAndRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "nodekode/auth";

// On login — generate both tokens at once
const { accessToken, refreshToken } = generateAccessAndRefreshToken({
  sub: user.id,
  email: user.email,
  role: user.role,
});

// Verify (throws AppError.invalidCredentials on failure)
const payload = verifyAccessToken(token);
const payload = verifyRefreshToken(token);

// Middleware example
const authGuard = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw AppError.unauthorized("Token required");
  req.user = verifyAccessToken(token);
  next();
});
```

---

#### bcrypt

**Required peer dep:** `bcrypt`

```ts
import { hashPassword, comparePassword } from "nodekode/auth";

// On registration
const hashed = await hashPassword(req.body.password);
await db.users.create({ ...data, password: hashed });

// On login
const isMatch = await comparePassword(req.body.password, user.password);
if (!isMatch) throw AppError.invalidCredentials("Wrong password");
```

---

### Helpers — `nodekode/helpers`

Pure utility functions — no dependencies.

#### Pagination

```ts
import { getLimitAndOffset } from "nodekode/helpers";

// GET /users?page=2&limit=10
const { limit, offset, page } = getLimitAndOffset(req.query);
const users = await prisma.user.findMany({ take: limit, skip: offset });
```

#### Sorting

```ts
import { getSortKeyWithOrder } from "nodekode/helpers";

// GET /users?sort=createdAt&order=asc
const sort = getSortKeyWithOrder(req.query);
// → { createdAt: 1 }
const users = await UserModel.find().sort(sort);
```

#### Date Range

```ts
import { getDateRangeFromTimePeriod } from "nodekode/helpers";

const range = getDateRangeFromTimePeriod("week");
// → { startDate: Date, endDate: Date }

const orders = await prisma.order.findMany({
  where: { createdAt: { gte: range.startDate, lte: range.endDate } },
});
```

Supported periods: `"today"` | `"week"` | `"month"` | `"year"`

#### Validation

```ts
import { isValidEmail, isValidUrl } from "nodekode/helpers";

isValidEmail("user@example.com"); // true
isValidEmail("not-an-email");     // false
isValidUrl("https://example.com"); // true
```

#### String Utilities

```ts
import { slugify, capitalize } from "nodekode/helpers";

slugify("Hello World! 123");  // "hello-world-123"
capitalize("hello");          // "Hello"
```

#### Object Utilities

```ts
import { pick, omit, removeNullish } from "nodekode/helpers";

pick(user, ["id", "email"]);               // { id, email }
omit(user, ["password", "refreshToken"]);  // user without sensitive fields
removeNullish({ a: 1, b: null, c: undefined }); // { a: 1 }
```

#### Password & OTP

```ts
import { generateRandomPassword, getRandomOtp } from "nodekode/helpers";

generateRandomPassword(12); // "aB3xKp9mNqZt"
getRandomOtp();             // 847392
```

#### Type Coercion

```ts
import { stringToBoolean, convertToLongDate } from "nodekode/helpers";

stringToBoolean("true");    // true
stringToBoolean("false");   // false
convertToLongDate(new Date("2026-03-01")); // "Sunday, March 1"
```

---

## Full Express Setup Example

```ts
import express from "express";
import {
  AppError,
  expressErrorHandler,
  createLogger,
} from "nodekode/error";
import { ApiResponse } from "nodekode/api";
import { asyncHandler } from "nodekode/async";
import { generateAccessAndRefreshToken, verifyAccessToken } from "nodekode/auth";
import { hashPassword, comparePassword } from "nodekode/auth";
import { S3Storage } from "nodekode/aws";
import { getLimitAndOffset } from "nodekode/helpers";

const app = express();
const logger = createLogger("App");
const storage = new S3Storage();

app.use(express.json());

// Auth route
app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) throw AppError.notFound("User not found");

    const match = await comparePassword(password, user.password);
    if (!match) throw AppError.invalidCredentials("Wrong password");

    const tokens = generateAccessAndRefreshToken({ sub: user.id, email });
    res.json(new ApiResponse(200, tokens, "Login successful"));
  })
);

// File upload route
app.post(
  "/upload-url",
  asyncHandler(async (req, res) => {
    const { filename, contentType } = req.body;
    const url = await storage.putObjectUrl(filename, contentType);
    res.json(new ApiResponse(200, { url }, "Upload URL generated"));
  })
);

// Paginated list route
app.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { limit, offset } = getLimitAndOffset(req.query);
    const users = await UserService.findAll({ limit, offset });
    res.json(new ApiResponse(200, users));
  })
);

// Global error handler — must be last
app.use(expressErrorHandler);

app.listen(3000, () => logger.info("Server running on port 3000"));
```

---

## Environment Variables Reference

| Variable | Used by | Default |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `S3Storage` | — |
| `AWS_SECRET_ACCESS_KEY` | `S3Storage` | — |
| `AWS_REGION` | `S3Storage` | `us-east-1` |
| `AWS_BUCKET_NAME` | `S3Storage` | — |
| `AZURE_STORAGE_ACCOUNT_NAME` | `AzureStorage` | — |
| `AZURE_STORAGE_ACCOUNT_KEY` | `AzureStorage` | — |
| `AZURE_STORAGE_CONTAINER_NAME` | `AzureStorage` | — |
| `ACCESS_TOKEN_SECRET` | `generateAccessToken`, `verifyAccessToken` | — |
| `REFRESH_TOKEN_SECRET` | `generateRefreshToken`, `verifyRefreshToken` | — |
| `ACCESS_TOKEN_EXPIRES_IN` | `generateAccessToken` | `1h` |
| `REFRESH_TOKEN_EXPIRES_IN` | `generateRefreshToken` | `7d` |

---

## Peer Dependencies

| Package | Required for | Version |
|---|---|---|
| `express` | `asyncHandler`, `expressErrorHandler` | `>=4` |
| `@aws-sdk/client-s3` | `S3Storage` | `>=3` |
| `@aws-sdk/s3-request-presigner` | `S3Storage` | `>=3` |
| `@azure/storage-blob` | `AzureStorage` | `>=12` |
| `jsonwebtoken` | `generateAccessToken`, `verifyRefreshToken`, etc. | `>=9` |
| `bcrypt` | `hashPassword`, `comparePassword` | `>=5` |

All peer deps are **optional** — only install what you use.

---

## Contributing

```bash
git clone https://github.com/amirpoudel/nodekode.git
cd nodekode
npm install
npm run build:watch
```

---

## License

MIT © [amirpoudel](https://github.com/amirpoudel)
