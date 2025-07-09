data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

resource "oci_core_instance" "budgeteer" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "budgeteer"
  shape               = var.vm_shape

  create_vnic_details {
    subnet_id        = oci_core_subnet.budgeteer_subnet.id
    assign_public_ip = true
  }

  source_details {
    source_id   = var.ubuntu_image_id
    source_type = "image"
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data           = base64encode(templatefile("${path.module}/budgeteer-init.yaml.tpl", {}))
  }
}

output "budgeteer_public_ip" {
  value = oci_core_instance.budgeteer.public_ip
}

