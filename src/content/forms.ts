import { services } from "./services";

// Form microcopy written for the rebuild. flag: client to review wording.
export const forms = {
  flag: "Form labels, hints and messages written for the rebuild. Client to review.",
  fields: {
    name: { label: "Your name" },
    email: { label: "Email" },
    phone: { label: "Phone (optional)" },
    message: { label: "How can we help?" },
    spaceType: {
      label: "Type of space",
      // From the How It Works copy: "your home, office, café, or any other area".
      options: ["Home", "Office", "Café", "Other area"],
    },
    service: {
      label: "Service you are interested in",
      options: services.map((service) => service.title),
    },
    details: {
      label: "Tell us about your space",
      hint: "Dimensions, vibe, lighting and any inspirations or mood boards you love.",
    },
    company: { label: "Leave this field empty" },
  },
  errors: {
    name: "Please enter your name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number, or leave it blank.",
    message: "Please add a few words so we can help.",
    spaceType: "Please choose the type of space.",
    service: "Please choose a service.",
    details: "Please add a few words about your space.",
    summary: "Please check the highlighted fields.",
  },
  selectPlaceholder: "Choose one",
  submit: { contact: "Send message", consultation: "Request consultation" },
  pending: "Sending",
  notConnected: {
    title: "Thank you",
    body: "Online enquiries are not connected yet, so this message has not been sent. Please reach us on WhatsApp or by email for now.",
    whatsapp: "Chat on WhatsApp",
    flag: "Temporary until a delivery method is chosen.",
  },
  sent: {
    title: "Thank you",
    body: "We have your message and will get back to you shortly.",
  },
  // Email to the store inbox. Labels name each field in plain text.
  email: {
    subject: {
      contact: (name: string) => `Website message from ${name}`,
      consultation: (name: string) => `Consultation request from ${name}`,
    },
    labels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      message: "Message",
      spaceType: "Type of space",
      service: "Service",
      details: "About the space",
    },
  },
  pages: {
    contactEyebrow: "Get in touch",
    consultationEyebrow: "Start with your space",
  },
} as const;
