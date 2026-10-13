
import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';

const sendMail = async ({ email, subject, mailGenContent }) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Homely Hub',
            link: 'https://homelyhub-pearl.vercel.app'
        }
    });

    const html = mailGenerator.generate(mailGenContent);
    const text = mailGenerator.generatePlaintext(mailGenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: Number(process.env.MAILTRAP_SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: 'Homely Hub <hello@homelyhub.in>',
        to: email,
        subject,
        text,
        html
    });
};

const forgotPasswordMailGenContent = (name, resetUrl) => ({
    body: {
        name,
        intro: 'We are sending you a link to reset your Homely Hub password.',
        action: {
            instructions: 'Click the button below to reset your password.',
            button: {
                color: '#22AAFF',
                text: 'Reset your password',
                link: resetUrl
            }
        },
        outro: 'If you did not request a password reset, you can ignore this email.'
    }
});

export { sendMail, forgotPasswordMailGenContent };
