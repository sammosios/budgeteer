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

variable "environments" {
  description = "Map of environment configurations."
  type = map(object({
    display_name      = string
    frontend_url      = string
    api_url           = string
    git_branch        = string
  }))
  default = {
    dev = {
      display_name      = "budgeteer-dev"
      frontend_url = "https://dev.budgeteer.sammosios.com"
      api_url        = "https://api.dev.budgeteer.sammosios.com"
      git_branch      = "main"

    }
    prod = {
      display_name      = "budgeteer-prod"
      frontend_url = "https://budgeteer.sammosios.com"
      api_url        = "https://api.budgeteer.sammosios.com"
      git_branch      = "main"
    }
  }
}

