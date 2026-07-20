import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/* =========================================================
   AUTHENTICATION TABLES
   ========================================================= */

export const appUsers = pgTable(
  "app_users",
  {
    id: text("id").primaryKey(),

    name: text("name").notNull(),

    email: text("email")
      .notNull()
      .unique(),

    passwordHash:
      text("password_hash").notNull(),

    passwordHistory:
      jsonb("password_history")
        .notNull()
        .default([]),

    role: text("role").notNull(),

    status: text("status")
      .notNull()
      .default("active"),

    mustChangePassword:
      boolean(
        "must_change_password",
      )
        .notNull()
        .default(true),

    failedLoginAttempts:
      integer(
        "failed_login_attempts",
      )
        .notNull()
        .default(0),

    lockedUntil: timestamp(
      "locked_until",
      {
        withTimezone: true,
      },
    ),

    sessionVersion:
      integer("session_version")
        .notNull()
        .default(1),

    lastLoginAt: timestamp(
      "last_login_at",
      {
        withTimezone: true,
      },
    ),

    passwordChangedAt:
      timestamp(
        "password_changed_at",
        {
          withTimezone: true,
        },
      )
        .notNull()
        .defaultNow(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    createdBy:
      text("created_by"),

    updatedBy:
      text("updated_by"),
  },
);

export const authAuditLogs =
  pgTable(
    "auth_audit_logs",
    {
      id: text("id").primaryKey(),

      timestamp: timestamp(
        "timestamp",
        {
          withTimezone: true,
        },
      )
        .notNull()
        .defaultNow(),

      actorUserId:
        text("actor_user_id"),

      actorEmail:
        text("actor_email")
          .notNull(),

      action:
        text("action").notNull(),

      targetUserId:
        text("target_user_id"),

      targetEmail:
        text("target_email"),

      ipAddress:
        text("ip_address"),

      userAgent:
        text("user_agent"),

      result:
        text("result").notNull(),

      details:
        text("details")
          .notNull()
          .default(""),
    },
  );

/*
 * Backward-compatible export.
 * Existing imports using `users`
 * will continue to work.
 */
export const users = appUsers;

/* =========================================================
   PUBLISHERS
   ========================================================= */

export const publishers =
  pgTable("publishers", {
    id: text("id").primaryKey(),

    publisher_number:
      text("publisher_number")
        .notNull()
        .unique(),

    publisher_name:
      text("publisher_name")
        .notNull(),

    contact_person:
      text("contact_person"),

    phone: text("phone"),

    email: text("email"),

    address: text("address"),

    credit_days:
      integer("credit_days")
        .notNull(),

    status:
      text("status").notNull(),

    notes: text("notes"),

    created_at:
      text("created_at")
        .notNull(),
  });

/* =========================================================
   LOCATIONS
   ========================================================= */

export const locations =
  pgTable("locations", {
    id: text("id").primaryKey(),

    code: text("code")
      .notNull()
      .unique(),

    name: text("name").notNull(),

    type: text("type").notNull(),

    city: text("city"),

    address: text("address"),

    contact_person:
      text("contact_person"),

    phone: text("phone"),

    status:
      text("status").notNull(),
  });

/* =========================================================
   CLASSIFICATIONS
   ========================================================= */

export const categories =
  pgTable("categories", {
    id: text("id").primaryKey(),

    name: text("name").notNull(),

    status:
      text("status").notNull(),
  });

export const subjects =
  pgTable("subjects", {
    id: text("id").primaryKey(),

    name: text("name").notNull(),

    status:
      text("status").notNull(),
  });

export const classes =
  pgTable("classes", {
    id: text("id").primaryKey(),

    name: text("name").notNull(),

    status:
      text("status").notNull(),
  });

/* =========================================================
   BOOKS
   ========================================================= */

export const books =
  pgTable("books", {
    id: text("id").primaryKey(),

    book_number:
      text("book_number")
        .notNull()
        .unique(),

    title: text("title")
      .notNull(),

    barcode:
      text("barcode").unique(),

    ISBN:
      text("ISBN").unique(),

    publisher_id:
      text("publisher_id")
        .notNull()
        .references(
          () => publishers.id,
        ),

    category_id:
      text("category_id")
        .notNull()
        .references(
          () => categories.id,
        ),

    subject_id:
      text("subject_id")
        .notNull()
        .references(
          () => subjects.id,
        ),

    class_id:
      text("class_id")
        .notNull()
        .references(
          () => classes.id,
        ),

    purchase_cost:
      real("purchase_cost")
        .notNull(),

    sale_price:
      real("sale_price")
        .notNull(),

    reorder_level:
      integer("reorder_level")
        .notNull(),

    cover_image:
      text("cover_image"),

    status:
      text("status").notNull(),

    notes: text("notes"),

    created_at:
      text("created_at")
        .notNull(),
  });

/* =========================================================
   STOCK ENTRIES
   ========================================================= */

export const stock_entries =
  pgTable("stock_entries", {
    id: text("id").primaryKey(),

    entry_number:
      text("entry_number")
        .notNull()
        .unique(),

    date: text("date").notNull(),

    book_id:
      text("book_id")
        .notNull()
        .references(
          () => books.id,
        ),

    location_id:
      text("location_id")
        .notNull()
        .references(
          () => locations.id,
        ),

    quantity:
      integer("quantity")
        .notNull(),

    unit_cost:
      real("unit_cost")
        .notNull(),

    reference_number:
      text("reference_number"),

    notes: text("notes"),

    created_at:
      text("created_at")
        .notNull(),
  });

/* =========================================================
   STOCK BALANCES
   ========================================================= */

export const stock_balances =
  pgTable("stock_balances", {
    id: text("id").primaryKey(),

    book_id:
      text("book_id")
        .notNull()
        .references(
          () => books.id,
        ),

    location_id:
      text("location_id")
        .notNull()
        .references(
          () => locations.id,
        ),

    quantity:
      integer("quantity")
        .notNull(),
  });

/* =========================================================
   STOCK HISTORY
   ========================================================= */

export const stock_history =
  pgTable("stock_history", {
    id: text("id").primaryKey(),

    date: text("date").notNull(),

    book_id:
      text("book_id")
        .notNull()
        .references(
          () => books.id,
        ),

    location_id:
      text("location_id")
        .notNull()
        .references(
          () => locations.id,
        ),

    movement_type:
      text("movement_type")
        .notNull(),

    quantity_in:
      integer("quantity_in")
        .notNull(),

    quantity_out:
      integer("quantity_out")
        .notNull(),

    balance_after:
      integer("balance_after")
        .notNull(),

    reference_number:
      text("reference_number"),

    notes: text("notes"),

    created_at:
      text("created_at")
        .notNull(),
  });

/* =========================================================
   SALES
   ========================================================= */

export const sales =
  pgTable("sales", {
    id: text("id").primaryKey(),

    sale_number:
      text("sale_number")
        .notNull()
        .unique(),

    date: text("date").notNull(),

    location_id:
      text("location_id")
        .notNull()
        .references(
          () => locations.id,
        ),

    customer_name:
      text("customer_name"),

    payment_method:
      text("payment_method")
        .notNull(),

    notes: text("notes"),

    created_at:
      text("created_at")
        .notNull(),

    total_amount:
      real("total_amount")
        .notNull(),

    discount:
      real("discount")
        .notNull(),
  });

export const sale_items =
  pgTable("sale_items", {
    id: text("id").primaryKey(),

    sale_id:
      text("sale_id")
        .notNull()
        .references(
          () => sales.id,
        ),

    book_id:
      text("book_id")
        .notNull()
        .references(
          () => books.id,
        ),

    quantity:
      integer("quantity")
        .notNull(),

    unit_price:
      real("unit_price")
        .notNull(),

    discount:
      real("discount")
        .notNull(),

    line_total:
      real("line_total")
        .notNull(),
  });

/* =========================================================
   CUSTOMER RETURNS
   ========================================================= */

export const customer_returns =
  pgTable(
    "customer_returns",
    {
      id: text("id").primaryKey(),

      return_number:
        text("return_number")
          .notNull()
          .unique(),

      date:
        text("date").notNull(),

      customer_name:
        text("customer_name"),

      original_sale_number:
        text(
          "original_sale_number",
        ),

      book_id:
        text("book_id")
          .notNull()
          .references(
            () => books.id,
          ),

      location_id:
        text("location_id")
          .notNull()
          .references(
            () => locations.id,
          ),

      quantity:
        integer("quantity")
          .notNull(),

      reason:
        text("reason").notNull(),

      notes: text("notes"),

      created_at:
        text("created_at")
          .notNull(),
    },
  );

/* =========================================================
   PUBLISHER RETURNS
   ========================================================= */

export const publisher_returns =
  pgTable(
    "publisher_returns",
    {
      id: text("id").primaryKey(),

      return_number:
        text("return_number")
          .notNull()
          .unique(),

      date:
        text("date").notNull(),

      publisher_id:
        text("publisher_id")
          .notNull()
          .references(
            () => publishers.id,
          ),

      book_id:
        text("book_id")
          .notNull()
          .references(
            () => books.id,
          ),

      location_id:
        text("location_id")
          .notNull()
          .references(
            () => locations.id,
          ),

      quantity:
        integer("quantity")
          .notNull(),

      reason:
        text("reason").notNull(),

      notes: text("notes"),

      created_at:
        text("created_at")
          .notNull(),
    },
  );

/* =========================================================
   STOCK TRANSFERS
   ========================================================= */

export const stock_transfers =
  pgTable(
    "stock_transfers",
    {
      id: text("id").primaryKey(),

      transfer_number:
        text("transfer_number")
          .notNull()
          .unique(),

      date:
        text("date").notNull(),

      from_location_id:
        text(
          "from_location_id",
        )
          .notNull()
          .references(
            () => locations.id,
          ),

      to_location_id:
        text(
          "to_location_id",
        )
          .notNull()
          .references(
            () => locations.id,
          ),

      book_id:
        text("book_id")
          .notNull()
          .references(
            () => books.id,
          ),

      quantity:
        integer("quantity")
          .notNull(),

      notes: text("notes"),

      created_at:
        text("created_at")
          .notNull(),
    },
  );

/* =========================================================
   DAMAGE AND LOSS
   ========================================================= */

export const damage_loss_records =
  pgTable(
    "damage_loss_records",
    {
      id: text("id").primaryKey(),

      date:
        text("date").notNull(),

      book_id:
        text("book_id")
          .notNull()
          .references(
            () => books.id,
          ),

      location_id:
        text("location_id")
          .notNull()
          .references(
            () => locations.id,
          ),

      quantity:
        integer("quantity")
          .notNull(),

      reason:
        text("reason").notNull(),

      notes: text("notes"),

      created_at:
        text("created_at")
          .notNull(),
    },
  );

/* =========================================================
   LIVE BUSINESS AUDIT LOGS
   ========================================================= */

export const live_logs =
  pgTable("live_logs", {
    id: text("id").primaryKey(),

    timestamp:
      text("timestamp")
        .notNull(),

    user:
      text("user").notNull(),

    module:
      text("module").notNull(),

    action:
      text("action").notNull(),

    record_number:
      text("record_number")
        .notNull(),

    description:
      text("description")
        .notNull(),

    severity:
      text("severity")
        .notNull(),
  });