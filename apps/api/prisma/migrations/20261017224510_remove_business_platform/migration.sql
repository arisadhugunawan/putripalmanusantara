-- DropForeignKey
ALTER TABLE "company_users" DROP CONSTRAINT "company_users_external_account_id_fkey";

-- DropForeignKey
ALTER TABLE "company_users" DROP CONSTRAINT "company_users_company_id_fkey";

-- DropForeignKey
ALTER TABLE "business_relationships" DROP CONSTRAINT "business_relationships_company_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiries" DROP CONSTRAINT "inquiries_company_id_fkey";

-- DropForeignKey
ALTER TABLE "inquiries" DROP CONSTRAINT "inquiries_source_quotation_request_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_company_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_source_inquiry_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_source_quotation_request_id_fkey";

-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_company_id_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_company_id_fkey";

-- DropForeignKey
ALTER TABLE "rfqs" DROP CONSTRAINT "rfqs_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "rfqs" DROP CONSTRAINT "rfqs_company_id_fkey";

-- DropForeignKey
ALTER TABLE "rfq_items" DROP CONSTRAINT "rfq_items_rfq_id_fkey";

-- DropForeignKey
ALTER TABLE "rfq_items" DROP CONSTRAINT "rfq_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_rfq_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_company_id_fkey";

-- DropForeignKey
ALTER TABLE "quotation_items" DROP CONSTRAINT "quotation_items_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "quotation_items" DROP CONSTRAINT "quotation_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_company_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_items" DROP CONSTRAINT "sales_order_items_sales_order_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_items" DROP CONSTRAINT "sales_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_request_items" DROP CONSTRAINT "purchase_request_items_purchase_request_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_request_items" DROP CONSTRAINT "purchase_request_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_rfqs" DROP CONSTRAINT "supplier_rfqs_purchase_request_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_rfqs" DROP CONSTRAINT "supplier_rfqs_supplier_company_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_rfq_items" DROP CONSTRAINT "supplier_rfq_items_supplier_rfq_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_rfq_items" DROP CONSTRAINT "supplier_rfq_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_quotations" DROP CONSTRAINT "supplier_quotations_supplier_rfq_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_quotations" DROP CONSTRAINT "supplier_quotations_supplier_company_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_quotation_items" DROP CONSTRAINT "supplier_quotation_items_supplier_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "supplier_quotation_items" DROP CONSTRAINT "supplier_quotation_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_purchase_request_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplier_quotation_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplier_company_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "warehouse_locations" DROP CONSTRAINT "warehouse_locations_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "receivings" DROP CONSTRAINT "receivings_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "receivings" DROP CONSTRAINT "receivings_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "receivings" DROP CONSTRAINT "receivings_supplier_company_id_fkey";

-- DropForeignKey
ALTER TABLE "receiving_items" DROP CONSTRAINT "receiving_items_receiving_id_fkey";

-- DropForeignKey
ALTER TABLE "receiving_items" DROP CONSTRAINT "receiving_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "receiving_items" DROP CONSTRAINT "receiving_items_purchase_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "weighbridge_transactions" DROP CONSTRAINT "weighbridge_transactions_receiving_id_fkey";

-- DropForeignKey
ALTER TABLE "weighbridge_transactions" DROP CONSTRAINT "weighbridge_transactions_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_receiving_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_receiving_item_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_supplier_company_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "qc_inspections" DROP CONSTRAINT "qc_inspections_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "qc_results" DROP CONSTRAINT "qc_results_qc_inspection_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_warehouse_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_inventory_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_warehouse_location_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_product_id_fkey";

-- DropForeignKey
ALTER TABLE "production_orders" DROP CONSTRAINT "production_orders_product_id_fkey";

-- DropForeignKey
ALTER TABLE "production_orders" DROP CONSTRAINT "production_orders_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "production_batches" DROP CONSTRAINT "production_batches_production_order_id_fkey";

-- DropForeignKey
ALTER TABLE "production_batches" DROP CONSTRAINT "production_batches_product_id_fkey";

-- DropForeignKey
ALTER TABLE "production_batches" DROP CONSTRAINT "production_batches_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "production_inputs" DROP CONSTRAINT "production_inputs_production_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "production_inputs" DROP CONSTRAINT "production_inputs_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "production_inputs" DROP CONSTRAINT "production_inputs_inventory_id_fkey";

-- DropForeignKey
ALTER TABLE "production_inputs" DROP CONSTRAINT "production_inputs_product_id_fkey";

-- DropForeignKey
ALTER TABLE "heating_batches" DROP CONSTRAINT "heating_batches_production_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_orders" DROP CONSTRAINT "packing_orders_production_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_orders" DROP CONSTRAINT "packing_orders_sales_order_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_orders" DROP CONSTRAINT "packing_orders_warehouse_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_items" DROP CONSTRAINT "packing_items_packing_order_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_items" DROP CONSTRAINT "packing_items_inventory_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_items" DROP CONSTRAINT "packing_items_inventory_id_fkey";

-- DropForeignKey
ALTER TABLE "packing_items" DROP CONSTRAINT "packing_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "containers" DROP CONSTRAINT "containers_shipment_id_fkey";

-- DropForeignKey
ALTER TABLE "loading_plans" DROP CONSTRAINT "loading_plans_container_id_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_sales_order_id_fkey";

-- DropForeignKey
ALTER TABLE "shipment_items" DROP CONSTRAINT "shipment_items_shipment_id_fkey";

-- DropForeignKey
ALTER TABLE "shipment_items" DROP CONSTRAINT "shipment_items_packing_order_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_file_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_type_id_fkey";

-- DropForeignKey
ALTER TABLE "document_links" DROP CONSTRAINT "document_links_document_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_sales_order_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_company_id_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_company_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropTable
DROP TABLE "external_accounts";

-- DropTable
DROP TABLE "companies";

-- DropTable
DROP TABLE "company_users";

-- DropTable
DROP TABLE "business_relationships";

-- DropTable
DROP TABLE "inquiries";

-- DropTable
DROP TABLE "leads";

-- DropTable
DROP TABLE "opportunities";

-- DropTable
DROP TABLE "activities";

-- DropTable
DROP TABLE "rfqs";

-- DropTable
DROP TABLE "rfq_items";

-- DropTable
DROP TABLE "quotations";

-- DropTable
DROP TABLE "quotation_items";

-- DropTable
DROP TABLE "sales_orders";

-- DropTable
DROP TABLE "sales_order_items";

-- DropTable
DROP TABLE "purchase_requests";

-- DropTable
DROP TABLE "purchase_request_items";

-- DropTable
DROP TABLE "supplier_rfqs";

-- DropTable
DROP TABLE "supplier_rfq_items";

-- DropTable
DROP TABLE "supplier_quotations";

-- DropTable
DROP TABLE "supplier_quotation_items";

-- DropTable
DROP TABLE "purchase_orders";

-- DropTable
DROP TABLE "purchase_order_items";

-- DropTable
DROP TABLE "warehouses";

-- DropTable
DROP TABLE "warehouse_locations";

-- DropTable
DROP TABLE "receivings";

-- DropTable
DROP TABLE "receiving_items";

-- DropTable
DROP TABLE "weighbridge_transactions";

-- DropTable
DROP TABLE "inventory_lots";

-- DropTable
DROP TABLE "qc_inspections";

-- DropTable
DROP TABLE "qc_results";

-- DropTable
DROP TABLE "inventories";

-- DropTable
DROP TABLE "inventory_movements";

-- DropTable
DROP TABLE "vehicles";

-- DropTable
DROP TABLE "production_orders";

-- DropTable
DROP TABLE "production_batches";

-- DropTable
DROP TABLE "production_inputs";

-- DropTable
DROP TABLE "heating_batches";

-- DropTable
DROP TABLE "packing_orders";

-- DropTable
DROP TABLE "packing_items";

-- DropTable
DROP TABLE "containers";

-- DropTable
DROP TABLE "loading_plans";

-- DropTable
DROP TABLE "shipments";

-- DropTable
DROP TABLE "shipment_items";

-- DropTable
DROP TABLE "document_types";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "document_links";

-- DropTable
DROP TABLE "invoices";

-- DropTable
DROP TABLE "invoice_items";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "business_activity_logs";

-- DropEnum
DROP TYPE "ExternalAccountStatus";

-- DropEnum
DROP TYPE "CompanyStatus";

-- DropEnum
DROP TYPE "CompanyUserRole";

-- DropEnum
DROP TYPE "CompanyUserStatus";

-- DropEnum
DROP TYPE "BusinessRelationshipType";

-- DropEnum
DROP TYPE "BusinessRelationshipStatus";

-- DropEnum
DROP TYPE "InquirySource";

-- DropEnum
DROP TYPE "InquiryStatus";

-- DropEnum
DROP TYPE "LeadStatus";

-- DropEnum
DROP TYPE "OpportunityStage";

-- DropEnum
DROP TYPE "ActivityType";

-- DropEnum
DROP TYPE "RFQStatus";

-- DropEnum
DROP TYPE "QuotationStatus";

-- DropEnum
DROP TYPE "SalesOrderStatus";

-- DropEnum
DROP TYPE "PurchaseRequestStatus";

-- DropEnum
DROP TYPE "SupplierRFQStatus";

-- DropEnum
DROP TYPE "SupplierQuotationStatus";

-- DropEnum
DROP TYPE "PurchaseOrderStatus";

-- DropEnum
DROP TYPE "WarehouseStatus";

-- DropEnum
DROP TYPE "WarehouseLocationStatus";

-- DropEnum
DROP TYPE "ReceivingStatus";

-- DropEnum
DROP TYPE "WeighbridgeStatus";

-- DropEnum
DROP TYPE "InventoryLotStatus";

-- DropEnum
DROP TYPE "QCInspectionType";

-- DropEnum
DROP TYPE "QCInspectionStatus";

-- DropEnum
DROP TYPE "QCResultStatus";

-- DropEnum
DROP TYPE "InventoryStatus";

-- DropEnum
DROP TYPE "InventoryMovementType";

-- DropEnum
DROP TYPE "VehicleStatus";

-- DropEnum
DROP TYPE "ProductionOrderStatus";

-- DropEnum
DROP TYPE "ProductionBatchStatus";

-- DropEnum
DROP TYPE "HeatingStatus";

-- DropEnum
DROP TYPE "PackingOrderStatus";

-- DropEnum
DROP TYPE "ContainerStatus";

-- DropEnum
DROP TYPE "LoadingPlanStatus";

-- DropEnum
DROP TYPE "ShipmentStatus";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ConversationStatus";

