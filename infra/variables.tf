variable "compartment_ocid" {
  description = "The OCID of the compartment."
}

variable "ssh_public_key_path" {
  description = "The path to the SSH public key file."
  default     = "./ssh-pub.key"
}

variable "vm_shape" {
  description = "The shape of the VM."
  default     = "VM.Standard.E2.1.Micro"
}

variable "ubuntu_image_id" {
  description = "The OCID of the Ubuntu 24.04 image."
  default     = "ocid1.image.oc1.eu-stockholm-1.aaaaaaaam6t7hfwppnu4ki6eej4kfytqfapcsrtuyu5r2rqybidhtr6k54ja"
}

