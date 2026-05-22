CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE provinces (
    province_id INTEGER PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL
);

CREATE TABLE vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID NOT NULL,
    plate_prefix VARCHAR(10) NOT NULL,
    plate_number VARCHAR(10) NOT NULL,
    province_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_plate_prefix_plate_number_province_id_key UNIQUE (
        plate_prefix,
        plate_number,
        province_id
    ),
    CONSTRAINT vehicles_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id) ON DELETE CASCADE,
    CONSTRAINT vehicles_province_id_fk FOREIGN KEY (province_id) REFERENCES provinces (province_id) ON DELETE RESTRICT
);

CREATE TABLE parking_slots (
    slot_id SERIAL PRIMARY KEY,
    slot_code VARCHAR(10) UNIQUE NOT NULL,
    vehicle_id UUID UNIQUE,
    CONSTRAINT parking_slots_vehicle_id_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id) ON DELETE SET NULL
);

CREATE TABLE parking_rentals (
    rental_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    slot_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    last_paid_month DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT parking_rentals_tenant_id_fk FOREIGN KEY (tenant_id) REFERENCES tenants (tenant_id) ON DELETE CASCADE,
    CONSTRAINT parking_rentals_vehicle_id_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id) ON DELETE CASCADE,
    CONSTRAINT parking_rentals_slot_id_fk FOREIGN KEY (slot_id) REFERENCES parking_slots (slot_id) ON DELETE RESTRICT
);

CREATE TABLE parking_logs (
    log_id BIGSERIAL PRIMARY KEY,
    vehicle_id UUID,
    slot_id INTEGER,
    event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('IN', 'OUT')),
    detected_plate VARCHAR(30) NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT parking_logs_vehicle_id_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id) ON DELETE SET NULL,
    CONSTRAINT parking_logs_slot_id_fk FOREIGN KEY (slot_id) REFERENCES parking_slots (slot_id) ON DELETE SET NULL
);