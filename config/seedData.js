const EmergencyRequest = require("../models/EmergencyRequest");
const Campaign = require("../models/Campaign");
const Article = require("../models/Article");
const Faq = require("../models/Faq");
const Testimonial = require("../models/Testimonial");

const seedDatabase = async () => {
  try {
    // 1. Seed Emergency Requests if empty
    const reqCount = await EmergencyRequest.countDocuments();
    if (reqCount === 0) {
      await EmergencyRequest.insertMany([
        {
          hospital: "Apollo Speciality Hospital",
          location: "Chennai, TN",
          blood: "O-ve",
          patient: "Pediatric Cardiac Patient (Urgent OT)",
          urgency: "Immediate",
          unitsRequired: 2,
          contactPhone: "+91 985-452-964",
          isActive: true,
        },
        {
          hospital: "AIIMS Trauma Center",
          location: "New Delhi, DL",
          blood: "B+ve",
          patient: "Trauma ICU Patient",
          urgency: "Within 4 Hours",
          unitsRequired: 3,
          contactPhone: "+91 985-452-964",
          isActive: true,
        },
        {
          hospital: "Tata Memorial Center",
          location: "Mumbai, MH",
          blood: "AB-ve",
          patient: "Oncology Transfusion Unit",
          urgency: "Within 6 Hours",
          unitsRequired: 1,
          contactPhone: "+91 985-452-964",
          isActive: true,
        },
        {
          hospital: "Fortis Hospital",
          location: "Bengaluru, KA",
          blood: "A+ve",
          patient: "Emergency Surgical Care",
          urgency: "Within 12 Hours",
          unitsRequired: 2,
          contactPhone: "+91 985-452-964",
          isActive: true,
        },
      ]);
      console.log("Seeded initial Emergency Requests successfully.");
    }

    // 2. Seed Campaigns if empty
    const campCount = await Campaign.countDocuments();
    if (campCount === 0) {
      await Campaign.insertMany([
        {
          title: "Pediatric Congenital Heart Surgeries",
          focus: "Child Healthcare",
          image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop",
          goal: 1000000,
          raised: 745000,
          beneficiaries: "14 children supported",
          desc: "Funding surgical costs and postoperative ICU care for pediatric cardiac patients from economically disadvantaged backgrounds.",
          isActive: true,
        },
        {
          title: "Transitional Accommodation for Foster Youth",
          focus: "Community Support",
          image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
          goal: 600000,
          raised: 480000,
          beneficiaries: "28 young adults housed",
          desc: "Providing safe transitional apartments, food stipends, and vocational guidance for young adults aging out of foster systems.",
          isActive: true,
        },
        {
          title: "Mobile Rural Blood Testing & Collection Vans",
          focus: "Healthcare Access",
          image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800&auto=format&fit=crop",
          goal: 500000,
          raised: 390000,
          beneficiaries: "18 rural clinics equipped",
          desc: "Equipping temperature-controlled transport vehicles with rapid hemoglobin and infectious screening kits for semi-rural drives.",
          isActive: true,
        },
      ]);
      console.log("Seeded initial Campaigns successfully.");
    }

    // 3. Seed Articles if empty
    const artCount = await Article.countDocuments();
    if (artCount === 0) {
      await Article.insertMany([
        {
          title: "The Golden Hour in Trauma Resuscitation: Why Rapid Matching Saves Lives",
          category: "Emergency Care",
          readTime: "4 min read",
          date: "Oct 28, 2026",
          image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop",
          excerpt: "In acute hemorrhagic trauma, patient survival drops significantly if transfusion is delayed past the initial hour. How local neighborhood donor networks are solving transit bottlenecks.",
          link: "/blog/blood",
          isPublished: true,
        },
        {
          title: "Platelet Apheresis vs Whole Blood: Understanding Hospital Demands",
          category: "Transfusion Science",
          readTime: "5 min read",
          date: "Oct 22, 2026",
          image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=800&auto=format&fit=crop",
          excerpt: "Cancer therapies and bone marrow procedures require concentrated platelets that carry an ultra-short 5-day shelf life. Here is how single-donor apheresis functions.",
          link: "/blog/process",
          isPublished: true,
        },
        {
          title: "Iron Regulation and Erythropoiesis: What Donors Need to Know",
          category: "Donor Guidelines",
          readTime: "3 min read",
          date: "Oct 15, 2026",
          image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800&auto=format&fit=crop",
          excerpt: "Hematologists explain the natural regenerative cycle of bone marrow and why a 90-day rest interval ensures sustained personal vitality.",
          link: "/blog/blood",
          isPublished: true,
        },
        {
          title: "Pediatric Cardiac Sponsorship: Aarav's Path to Recovery",
          category: "Patient Impact",
          readTime: "6 min read",
          date: "Sep 30, 2026",
          image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=800&auto=format&fit=crop",
          excerpt: "Diagnosed with congenital heart defects at age 4, Aarav received life-saving open-heart corrective surgery funded by LifeLink community relief donors.",
          link: "/about",
          isPublished: true,
        },
      ]);
      console.log("Seeded initial Articles successfully.");
    }

    // 4. Seed FAQs if empty
    const faqCount = await Faq.countDocuments();
    if (faqCount === 0) {
      await Faq.insertMany([
        {
          question: "How fast can I reach a voluntary donor during an emergency?",
          answer: "Our verified directory provides direct telephone numbers filtered by your hospital's postal pincode. You connect immediately with local donors without going through intermediate call queues.",
          category: "Emergency",
          order: 1,
          isActive: true,
        },
        {
          question: "How are donor contact numbers verified?",
          answer: "All voluntary donors complete mobile number validation and profile verification upon registration to ensure outdated or unreachable numbers are excluded.",
          category: "Verification",
          order: 2,
          isActive: true,
        },
        {
          question: "How do I receive my Section 80G tax exemption receipt?",
          answer: "Following any financial contribution through our portal, your digital 80G certificate is automatically generated and emailed to your registered email address within 15 minutes.",
          category: "Donation",
          order: 3,
          isActive: true,
        },
        {
          question: "Can our college or corporation host a voluntary blood drive?",
          answer: "Yes. Select 'Volunteer Blood Camps' in the message form. Our regional hospital coordination team will connect with you within 24 hours to organize mobile collection staff and equipment.",
          category: "Partnership",
          order: 4,
          isActive: true,
        },
      ]);
      console.log("Seeded initial FAQs successfully.");
    }

    // 5. Seed Testimonials if empty
    const testCount = await Testimonial.countDocuments();
    if (testCount === 0) {
      await Testimonial.insertMany([
        {
          quote: "When our pediatric patient required rare O-negative units at 2:00 AM, the LifeLink registry enabled our duty medical officer to coordinate directly with two donors who arrived within 35 minutes. It transformed an acute crisis into a safe surgical outcome.",
          author: "Dr. K. S. Ramanathan",
          role: "MD (Emergency Medicine), Apollo Care Chennai",
          isApproved: true,
        },
        {
          quote: "Being a voluntary donor is straightforward with LifeLink. I receive localized notifications when a matching patient in my area has an acute surgical need. Knowing my blood directly saved an emergency accident victim brings immense gratitude.",
          author: "Ananya Sharma",
          role: "Voluntary O+ Donor, Bengaluru",
          isApproved: true,
        },
      ]);
      console.log("Seeded initial Testimonials successfully.");
    }
  } catch (error) {
    console.error("Error during database seed:", error.message);
  }
};

module.exports = seedDatabase;

