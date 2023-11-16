export const createEmailTemplate = (param: {
  participant_name: string;
  quiz_administrator: string;
  quiz_name: string;
  quiz_link: string;
  quiz_date: string;
}) => {
  // HTML template with styling
  const emailTemplate = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aptitude Test Invitation</title>
    <style>
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #f8f8f8;
        margin: 0;
        padding: 0;
      }
  
      .container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
  
      h2 {
        color: #333;
        font-size: 24px;
        margin-bottom: 20px;
      }
  
      p {
        color: #555;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 15px;
      }
  
      strong {
        color: #333;
      }
  
      .cta-button {
        display: inline-block;
        padding: 12px 24px;
        margin-top: 20px;
        background-color: #3498db;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
        transition: background-color 0.3s ease;
      }

      a {
        color: #fff;
      }
      .cta-button:hover {
        background-color: #1f77c7;
      }
  
      .signature {
        margin-top: 20px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Aptitude Test Invitation</h2>
      <p>Dear <strong>${param.participant_name}</strong>,</p>
      <p>Congratulations! We are pleased to invite you to take part in our upcoming aptitude test on <strong>${param.quiz_name}</strong>.</p>
      <p>The test window is open from <strong>midnight to 11:59 PM</strong> on <strong> ${param.quiz_date}</strong>. <br/> 
      Make sure to allocate sufficient time and choose a quiet environment for an uninterrupted testing experience.</p>
      <p>To access the test, simply click the button below:</p>
      <a href="${param.quiz_link}" class="cta-button">Take the Test</a>
      <p class="signature">Best regards,<br><strong>${param.quiz_administrator}</strong></p>
    </div>
  </body>
  </html>
`;
  return emailTemplate;
};
