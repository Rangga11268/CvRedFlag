/**
 * Step 5: Cover Letter & Email Generator Prompts
 * Generates professional cover letters and job application emails.
 * Handles multiple languages, formats, and job categories.
 */

export interface Step5Params {
  cvText: string;
  jobDescription: string;
  language?: "id" | "en";
  format?: "cover_letter" | "body_email_1" | "body_email_2";
  jobCategory?: "software_engineer" | "general";
}

export interface Step5Result {
  systemPrompt: string;
  userPrompt: string;
}

export function buildStep5Prompts(params: Step5Params): Step5Result {
  const {
    cvText,
    jobDescription,
    language = "id",
    format = "cover_letter",
    jobCategory = "general",
  } = params;

  const isIndo = language === "id";
  const isEmail = format?.startsWith("body_email");
  const emailOption = format === "body_email_2" ? 2 : 1;
  const isSoftwareEngineer = jobCategory === "software_engineer";

  const currentDate = new Date();
  const todayDateString = isIndo
    ? currentDate.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
    : currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt = `You are an elite executive career coach, ATS resume writer, and programmer recruiter. Write a highly professional and tailored ${isEmail ? "Body Email cover draft" : "1-page Cover Letter"} in ${isIndo ? "Bahasa Indonesia" : "English"} for a ${isSoftwareEngineer ? "Software Engineer / IT Professional" : "General Professional"}. Respond ONLY in Markdown.`;

  let userPrompt: string;

  if (isSoftwareEngineer) {
    if (isEmail) {
      userPrompt = `Write a professional Job Application Body Email in ${isIndo ? "Bahasa Indonesia" : "English"} for a Software Engineer, following this template format:
Subject: Application for [Job Title] - [Your Full Name]

Dear Hiring Manager / [Recruiter Name],

My name is [Your Full Name], and I am writing to express my interest in the [Job Title] position at [Company Name]. With a strong background in software development and hands-on experience building applications using [Key Tech 1] and [Key Tech 2], I am excited about the opportunity to contribute to your engineering team.

In my recent experience, I successfully [mention 1 main technical accomplishment using quantitative metrics, e.g., optimized database queries reducing API latency by 35%]. I am highly passionate about writing clean, maintainable code, solving complex architectural challenges, and continuously learning new technologies.

I have attached my resume, which details my technical skills and project portfolio. You can also view my source code and previous works on my GitHub at [GitHub URL] and portfolio at [Portfolio URL].

Thank you for your time and consideration. I look forward to the possibility of discussing how my technical background aligns with the goals of [Company Name].

Best regards,

[Your Full Name]
[Phone Number]
[GitHub URL]
[LinkedIn / Portfolio URL]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- If recipient name is unknown, use a polite general salutation like "Dear Hiring Team,".
- Highlight specific tech stacks and quantitative achievements from the candidate's CV.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
    } else {
      userPrompt = `Write a formal Cover Letter in ${isIndo ? "Bahasa Indonesia" : "English"} for a Software Engineer, following this template format:
${todayDateString}

[Sender Name]
[City, Country] | [Email] | [Phone]
[LinkedIn] | [GitHub]

To:
Hiring Manager
[Company Name]
[Company Address Placeholder]

Dear Hiring Manager / [Recruiter Name],

My name is [Your Full Name], and I am writing to express my interest in the [Job Title] position at [Company Name]. With a strong background in software engineering and hands-on experience building scalable applications using [Key Tech 1] and [Key Tech 2], I am excited about the opportunity to contribute to your team.

In my recent experience, I successfully [describe 1-2 main technical accomplishments with quantitative metrics and how you solved them using specific tools]. I am highly passionate about writing clean, maintainable code, solving complex architectural challenges, and continuously learning new technologies.

I have attached my resume, which details my technical skills and project portfolio. You can also view my source code and previous works on my GitHub at [GitHub URL].

Thank you for your time and consideration. I look forward to the possibility of discussing how my technical background aligns with the goals of [Company Name].

Best regards,

[Your Full Name]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- Tailor details to whatever company is target in the Job Description.
- CRITICAL: You MUST use the current date at the top of the Cover Letter: ${todayDateString}. Do NOT use any other date.
- Output ONLY the final Cover Letter in Markdown format. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
    }
  } else {
    // General Professional
    if (isEmail) {
      if (isIndo) {
        if (emailOption === 1) {
          userPrompt = `Write a professional Body Email for a job application in Bahasa Indonesia, strictly following the tone and format of this template:
Subject: Lamaran untuk Posisi [Nama Posisi] - [Nama Kamu]
Yth. [Nama Penerima],

Saya berharap email ini menemui Anda dalam keadaan baik.
Nama saya [Nama Kamu], dan saya sangat tertarik untuk melamar posisi [Nama Posisi] di [Nama Perusahaan]. Saya telah melampirkan CV dan portofolio saya untuk pertimbangan Anda.
Dengan latar belakang saya di bidang [sebutkan bidang terkait, seperti Administrasi, Media Sosial, Desain Grafis, atau Akuntansi, etc], saya yakin dapat berkontribusi secara signifikan untuk tim Anda. Saya sangat antusias untuk dapat mendiskusikan bagaimana keterampilan dan pengalaman saya dapat memberikan nilai tambah bagi [Nama Perusahaan].

Terima kasih atas waktu dan perhatian Anda. Saya berharap dapat mendengar kabar dari Anda segera.

Hormat saya,
[Nama Kamu]
[Nomor Telepon Anda]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- If recipient name is unknown, use "Bapak/Ibu Pimpinan Rekrutmen" or similar.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
        } else {
          userPrompt = `Write a professional Body Email for a job application in Bahasa Indonesia, strictly following the tone and format of this template:
Subject: Lamaran untuk Posisi [Nama Posisi] - [Nama Kamu]
Yth. [Nama Penerima],

Perkenalkan, nama saya [Nama Kamu]. Saya menulis email ini untuk mengajukan lamaran pada posisi [Nama Posisi] di [Nama Perusahaan].
Saya memiliki pengalaman dan keterampilan yang relevan di bidang [Administrasi/Media Sosial/Desain Grafis/Akuntansi, etc] yang dapat mendukung tujuan dan kebutuhan perusahaan. Bersama email ini, saya lampirkan CV dan portofolio saya sebagai bahan pertimbangan.
Saya sangat antusias untuk dapat berkontribusi dan bergabung dengan tim yang inovatif dan dinamis di [Nama Perusahaan]. Saya siap untuk menjelaskan lebih lanjut tentang kualifikasi dan pengalaman saya dalam wawancara.

Terima kasih atas waktu dan kesempatan yang diberikan. Saya berharap dapat mendengar kabar baik dari kamu segera.

Hormat saya,
[Nama Kamu]
[Nomor Telepon Kamu]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- If recipient name is unknown, use "Bapak/Ibu Pimpinan Rekrutmen" or similar.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
        }
      } else {
        userPrompt = `Write a professional Body Email for a job application in English, following this template format:
Subject: Job Application: [Position Name] - [Your Name]
Dear [Recipient Name],

I hope this email finds you well.
My name is [Your Name], and I am writing to express my strong interest in the [Position Name] role at [Company Name]. I have attached my CV and portfolio for your consideration.
With my background in [mention relevant field], I am confident in my ability to contribute to your team. I am very enthusiastic about the opportunity to discuss how my skills and experience can bring value to [Company Name].

Thank you for your time and consideration. I look forward to hearing from you soon.

Best regards,
[Your Name]
[Your Phone Number]

Instructions:
- Fill in the brackets with the candidate's actual data from the CV and target Job Description.
- Output ONLY the final Subject and Body in Markdown format, with "Subject: ..." as the very first line. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
      }
    } else {
      // Cover Letter
      if (isIndo) {
        userPrompt = `Write a professional Cover Letter in Bahasa Indonesia, structured similarly to this template:
${todayDateString}

[Sender Name]
[City, Country] | [Email] | [Phone]

To:
Hiring Manager
[Company Name]
[Company Address Placeholder]

Selamat siang Bapak/Ibu...,

Nama saya [Nama Kamu], dengan pengalaman di [sebutkan bidang Kamu]. Saya tertarik untuk bergabung dengan [Nama Perusahaan], perusahaan yang saya kagumi karena [sebutkan alasan spesifik]. Meskipun saat ini tidak ada posisi yang terbuka, saya sangat ingin menawarkan kualifikasi dan minat yang kuat untuk berkontribusi. Saya yakin dengan kemampuan saya untuk memberikan nilai tambah bagi tim [Nama Perusahaan] dan siap untuk berdiskusi lebih lanjut dalam sebuah wawancara. Terlampir adalah CV saya untuk bahan pertimbangan Anda.

Terima kasih atas perhatian dan kesempatan yang diberikan.

Salam hormat,
[Nama Kamu]

Instructions:
- Tailor the template to the target Job Description and highlight the achievements from the CV.
- CRITICAL: You MUST use the current date at the top of the Cover Letter: ${todayDateString}. Do NOT use any other date.
- Include sender and recipient details at the top of the Cover Letter as shown in the template.
- Output ONLY the final Cover Letter in Markdown format. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
      } else {
        userPrompt = `Write a professional Cover Letter in English, structured similarly to this template:
${todayDateString}

[Sender Name]
[City, Country] | [Email] | [Phone]

To:
Hiring Manager
[Company Name]
[Company Address Placeholder]

Dear Ms/Mr. .....,

My name is [Your Name], with experience in [mention your field]. I am interested in joining [Company Name], a company I admire for [mention specific reasons]. Although there are currently no open positions, I am eager to offer my qualifications and strong interest in contributing. I am confident in my ability to add value to [Company Name]'s team and am prepared to discuss further in an interview. Attached is my CV for your consideration.

Thank you for your attention and this opportunity.

Best regards,
[Your Name]

Instructions:
- Tailor the template to the target Job Description and highlight the achievements from the CV.
- CRITICAL: You MUST use the current date at the top of the Cover Letter: ${todayDateString}. Do NOT use any other date.
- Include sender and recipient details at the top of the Cover Letter as shown in the template.
- Output ONLY the final Cover Letter in Markdown format. Do not include extra greetings, chat, or explanations.

Candidate's CV data:
${cvText}

Job Description:
${jobDescription}`;
      }
    }
  }

  return { systemPrompt, userPrompt };
}
