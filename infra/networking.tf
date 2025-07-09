resource "oci_core_vcn" "budgeteer_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = var.compartment_ocid
  display_name   = "budgeteer-vcn"
}

resource "oci_core_internet_gateway" "budgeteer_igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.budgeteer_vcn.id
  display_name   = "budgeteer-igw"
}

resource "oci_core_route_table" "budgeteer_route_table" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.budgeteer_vcn.id
  display_name   = "budgeteer-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.budgeteer_igw.id
  }
}

resource "oci_core_security_list" "budgeteer_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.budgeteer_vcn.id
  display_name   = "budgeteer-security-list"

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_subnet" "budgeteer_subnet" {
  cidr_block        = "10.0.1.0/24"
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.budgeteer_vcn.id
  display_name      = "budgeteer-subnet"
  route_table_id    = oci_core_route_table.budgeteer_route_table.id
  security_list_ids = [oci_core_security_list.budgeteer_security_list.id]
  dhcp_options_id   = oci_core_vcn.budgeteer_vcn.default_dhcp_options_id
}

