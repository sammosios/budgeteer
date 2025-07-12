terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "7.9.0"
    }
  }
}

provider "oci" {}
