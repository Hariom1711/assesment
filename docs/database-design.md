# Database Design

## Database Recommendation

Use PostgreSQL with the PostGIS extension. This gives the platform relational consistency for operations and payments, plus geospatial support for future nearest-collector assignment.

## Core Tables

### countries

Stores market-level configuration.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | Ghana, Nigeria, Côte d'Ivoire |
| iso_code | text | GH, NG, CI |
| default_currency_code | text | GHS, NGN, XOF |
| phone_code | text | +233, +234, +225 |
| is_active | boolean | Enables country rollout control |

### currencies

Stores supported currencies.

| Column | Type | Notes |
| --- | --- | --- |
| code | text | Primary key, for example GHS |
| name | text | Currency display name |
| symbol | text | Display symbol |
| decimal_places | integer | Usually 2 |

### users

Shared identity table for admins, customers, collectors, finance users, and support users.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| country_id | uuid | Default country |
| full_name | text | User name |
| phone | text | Unique per country |
| email | text | Optional for SMS-only users |
| password_hash | text | Nullable for SMS-only users until registered |
| status | text | active, suspended, pending |
| created_at | timestamptz | Creation date |

### roles and user_roles

Allows one user to have multiple roles in the same system.

Example roles:

- super_admin
- operations_admin
- finance_admin
- support_agent
- customer
- collector

### collectors

Stores collector-specific marketplace data.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | Links to users |
| approval_status | text | pending, approved, rejected, suspended |
| online_status | text | online, offline, busy |
| rating | numeric | Collector performance score |
| active_job_count | integer | Helps assignment decisions |
| service_zone_id | uuid | Preferred zone |
| approved_at | timestamptz | Approval date |

### collector_locations

Stores the latest collector location for tracking and dispatching.

| Column | Type | Notes |
| --- | --- | --- |
| collector_id | uuid | Primary key / foreign key |
| location | geography(Point, 4326) | PostGIS point |
| accuracy_meters | numeric | GPS accuracy |
| recorded_at | timestamptz | Last update time |

### sack_types

Defines official company sacks.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| country_id | uuid | Country-specific pricing |
| name | text | Small, Medium, Large |
| size_label | text | Human readable size |
| price_amount | numeric | Local currency amount |
| currency_code | text | GHS, NGN, XOF |
| is_active | boolean | Controls availability |

### sack_orders

Tracks sack sales to customers.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| customer_id | uuid | Buyer |
| country_id | uuid | Market |
| status | text | pending, paid, fulfilled, cancelled |
| total_amount | numeric | Order total |
| currency_code | text | Order currency |

### pickup_requests

Main operational record.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| reference_code | text | Human-friendly code for SMS/support |
| country_id | uuid | Market |
| customer_id | uuid | Requesting customer |
| pickup_type | text | sack, special |
| status | text | pending, assigned, completed, disputed, etc. |
| pickup_window | text | morning, afternoon, evening |
| location | geography(Point, 4326) | Pickup coordinates |
| address_text | text | Human-readable address |
| sack_count | integer | Normal pickup quantity |
| quoted_amount | numeric | Used for special pickups or final charge |
| currency_code | text | Payment currency |
| created_channel | text | web, mobile, sms, admin |
| created_at | timestamptz | Request date |

### pickup_items

Details sacks or special waste items attached to a pickup.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| pickup_request_id | uuid | Parent pickup |
| sack_type_id | uuid | Nullable for special pickup |
| quantity | integer | Item quantity |
| description | text | Special pickup notes |

### assignments

Tracks collector assignment history and override behavior.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| pickup_request_id | uuid | Pickup |
| collector_id | uuid | Assigned collector |
| assigned_by_user_id | uuid | Admin or system user |
| assignment_type | text | manual, automatic, override |
| status | text | offered, accepted, rejected, cancelled, completed |
| assigned_at | timestamptz | Assignment time |

### pickup_proofs

Stores photo confirmation records.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| pickup_request_id | uuid | Pickup |
| collector_id | uuid | Uploading collector |
| file_url | text | Storage URL or key |
| notes | text | Optional notes |
| uploaded_at | timestamptz | Upload time |
| verified_by_user_id | uuid | Admin verifier |
| verified_at | timestamptz | Verification time |

### payments

Provider-agnostic payment records.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| country_id | uuid | Market |
| customer_id | uuid | Payer |
| pickup_request_id | uuid | Nullable if payment is for sack order or wallet top-up |
| sack_order_id | uuid | Nullable |
| provider | text | paystack, flutterwave, hubtel, cash, wallet |
| method | text | momo, card, bank_transfer, cash, wallet |
| status | text | pending, successful, failed, refunded |
| amount | numeric | Paid amount |
| currency_code | text | Currency |
| provider_reference | text | External reference |
| metadata | jsonb | Provider payload |
| created_at | timestamptz | Payment creation date |

### wallets and wallet_transactions

Supports hybrid digital/cash/wallet payments and collector balances.

Wallet transaction types:

- customer_topup
- pickup_payment
- cash_collected
- collector_earning
- collector_payout
- refund
- adjustment

### sms_messages

Audits inbound and outbound SMS messages.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| country_id | uuid | Market |
| phone | text | Sender or recipient |
| direction | text | inbound, outbound |
| body | text | SMS body |
| parsed_command | text | PICKUP, STATUS, HELP |
| pickup_request_id | uuid | Linked request if created |
| provider | text | SMS provider |
| provider_message_id | text | External ID |
| created_at | timestamptz | Message time |

## Important Indexes

```sql
CREATE INDEX idx_pickup_requests_country_status ON pickup_requests (country_id, status);
CREATE INDEX idx_pickup_requests_created_at ON pickup_requests (created_at DESC);
CREATE INDEX idx_assignments_collector_status ON assignments (collector_id, status);
CREATE INDEX idx_payments_country_status ON payments (country_id, status);
CREATE INDEX idx_collector_locations_location ON collector_locations USING GIST (location);
CREATE INDEX idx_pickup_requests_location ON pickup_requests USING GIST (location);
```

## Multi-Country Design Rule

Every operational table should include `country_id` directly or indirectly. This makes reporting, permissions, currencies, and payment provider routing much simpler as the platform expands.
