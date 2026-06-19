# API Design

## API Style

Use REST for the first version because it is simple for web, mobile, SMS webhooks, and payment webhooks. GraphQL can be added later if the product needs complex dashboard query composition.

Base URL example:

```text
/api/v1
```

## Authentication Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Login for all roles |
| POST | `/auth/logout` | End session |
| GET | `/auth/me` | Return current user, roles, permissions, country |
| POST | `/auth/refresh` | Refresh access token |

## Country and Configuration Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/countries` | List active countries |
| POST | `/countries` | Create country, super admin only |
| GET | `/countries/:id/settings` | Get country settings |
| PATCH | `/countries/:id/settings` | Update currency, SMS, and payment settings |

## Pickup Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/pickups` | List pickups with filters by status, country, date, collector, customer |
| POST | `/pickups` | Create normal sack pickup |
| POST | `/pickups/special` | Create special pickup request |
| GET | `/pickups/:id` | View pickup detail |
| PATCH | `/pickups/:id/status` | Update pickup status |
| POST | `/pickups/:id/cancel` | Cancel pickup |
| POST | `/pickups/:id/quote` | Admin quote for special pickup |
| POST | `/pickups/:id/proofs` | Upload or attach proof photo |
| POST | `/pickups/:id/dispute` | Open dispute |

## Assignment Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/assignments/board` | Operations assignment board |
| POST | `/pickups/:id/assign` | Manually assign collector |
| POST | `/pickups/:id/auto-assign` | Trigger automatic assignment |
| POST | `/pickups/:id/override-assignment` | Admin override collector |
| POST | `/assignments/:id/accept` | Collector accepts job |
| POST | `/assignments/:id/reject` | Collector rejects job |

## Collector Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/collectors` | List collectors |
| POST | `/collectors/register` | Register collector |
| GET | `/collectors/:id` | Collector profile |
| PATCH | `/collectors/:id/approval` | Approve, reject, or suspend collector |
| PATCH | `/collectors/:id/availability` | Set online/offline status |
| POST | `/collectors/:id/location` | Update collector location |
| GET | `/collectors/:id/earnings` | Collector earnings summary |

## Sack Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/sack-types` | List official sack types and prices |
| POST | `/sack-types` | Create sack type |
| PATCH | `/sack-types/:id` | Update sack type or price |
| GET | `/sack-orders` | List sack purchases |
| POST | `/sack-orders` | Create sack purchase order |
| PATCH | `/sack-orders/:id/status` | Update fulfillment status |

## Payment Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/payments/initiate` | Start mobile money, card, bank transfer, or wallet payment |
| GET | `/payments` | Finance payment list |
| GET | `/payments/:id` | Payment detail |
| POST | `/payments/:id/refund` | Refund payment |
| POST | `/webhooks/payments/:provider` | Payment provider webhook |
| GET | `/wallets/:userId` | Wallet balance |
| GET | `/wallets/:userId/transactions` | Wallet ledger |

## SMS Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/webhooks/sms/:provider` | Inbound SMS webhook |
| GET | `/sms/messages` | Support/admin SMS history |
| POST | `/sms/send` | Send manual SMS notification |

## Reporting Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/reports/operations/daily` | Daily pickup report |
| GET | `/reports/operations/weekly` | Weekly pickup report |
| GET | `/reports/revenue` | Revenue report by country, method, date |
| GET | `/reports/collectors/performance` | Collector completion and rating report |
| GET | `/reports/customers/activity` | Customer booking activity |

## Example Pickup Creation Payload

```json
{
  "countryId": "ghana-country-id",
  "pickupType": "sack",
  "pickupWindow": "morning",
  "sackCount": 3,
  "items": [
    {
      "sackTypeId": "large-sack-id",
      "quantity": 3
    }
  ],
  "addressText": "East Legon, Accra",
  "latitude": 5.6501,
  "longitude": -0.1869,
  "paymentMethod": "momo"
}
```

## Example Assignment Payload

```json
{
  "collectorId": "collector-id",
  "assignmentType": "manual",
  "notes": "Assigned by operations after phone confirmation."
}
```

## Permission Examples

| Action | Allowed Roles |
| --- | --- |
| View all country settings | super_admin |
| Assign pickups | operations_admin, super_admin |
| Approve collectors | operations_admin, super_admin |
| View payment reports | finance_admin, super_admin |
| Upload proof photo | collector |
| Request pickup | customer, support_agent |
| Resolve disputes | support_agent, operations_admin, super_admin |
