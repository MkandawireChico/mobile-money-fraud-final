#!/usr/bin/env node

/**
 * Test Email OTP Functionality
 * 
 * This script tests the email OTP system to ensure emails are being sent correctly.
 * Run this after configuring your email credentials in .env file.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmailConfiguration = async () => {
    console.log('🧪 Testing Email OTP Configuration...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'Not set'}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'Not set'}`);
    console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '***configured***' : 'Not set'}`);
    console.log('');

    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('❌ Email configuration incomplete. Please add to .env file:');
        console.log('   EMAIL_SERVICE=gmail');
        console.log('   EMAIL_USER=your-email@gmail.com');
        console.log('   EMAIL_PASS=your-app-password');
        console.log('');
        console.log('📖 For Gmail, you need to:');
        console.log('   1. Enable 2-Factor Authentication');
        console.log('   2. Generate an App Password');
        console.log('   3. Use the App Password (not your regular password)');
        return false;
    }

    try {
        // Create transporter
        console.log('🔧 Creating email transporter...');
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection
        console.log('🔍 Verifying email connection...');
        await transporter.verify();
        console.log('✅ Email connection verified successfully!');

        // Generate test OTP
        const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔢 Generated test OTP: ${testOTP}`);

        // Prepare test email
        const testEmail = process.env.EMAIL_USER; // Send to self for testing
        const mailOptions = {
            from: {
                name: 'Malawi Mobile Money Fraud Detection System',
                address: process.env.EMAIL_USER
            },
            to: testEmail,
            subject: '🧪 Test OTP - Fraud Detection System',
            text: `
Hello,

This is a test email from the Malawi Mobile Money Fraud Detection System.

Your test OTP code is: ${testOTP}

This OTP is valid for 10 minutes.

If you received this email, your OTP email system is working correctly!

Test Details:
- Service: ${process.env.EMAIL_SERVICE}
- From: ${process.env.EMAIL_USER}
- Time: ${new Date().toLocaleString()}

Best regards,
Fraud Detection System Team
            `,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #1e40af; margin: 0;">🧪 Test Email</h1>
                            <h2 style="color: #1e40af; margin: 0;">🛡️ Fraud Detection System</h2>
                            <p style="color: #6b7280; margin: 5px 0;">Malawi Mobile Money Security</p>
                        </div>
                        
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <h3 style="color: #374151; margin-bottom: 15px;">Your Test OTP Code:</h3>
                            <div style="font-size: 32px; font-weight: bold; color: #1e40af; background-color: #dbeafe; padding: 15px; border-radius: 8px; letter-spacing: 3px;">
                                ${testOTP}
                            </div>
                            <p style="color: #6b7280; margin-top: 15px; font-size: 14px;">This OTP is valid for 10 minutes</p>
                        </div>
                        
                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                            <p style="color: #065f46; margin: 0; font-weight: bold;">✅ Success!</p>
                            <p style="color: #065f46; margin: 5px 0 0 0;">If you received this email, your OTP email system is working correctly!</p>
                        </div>
                        
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #374151; margin: 0 0 10px 0;">Test Details:</h4>
                            <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
                                <li>Service: ${process.env.EMAIL_SERVICE}</li>
                                <li>From: ${process.env.EMAIL_USER}</li>
                                <li>Time: ${new Date().toLocaleString()}</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                This is a test message from the Malawi Mobile Money Fraud Detection System.
                                <br>Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        // Send test email
        console.log(`📧 Sending test email to ${testEmail}...`);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log('');
        console.log('🎉 Email OTP system is working correctly!');
        console.log(`📬 Check your inbox at ${testEmail} for the test OTP email.`);
        
        return true;

    } catch (error) {
        console.log('❌ Email test failed:');
        console.log(`   Error: ${error.message}`);
        console.log('');
        
        if (error.code === 'EAUTH') {
            console.log('🔐 Authentication failed. Common solutions:');
            console.log('   1. For Gmail: Enable 2-Factor Authentication and use App Password');
            console.log('   2. Check that EMAIL_USER and EMAIL_PASS are correct');
            console.log('   3. Make sure "Less secure app access" is enabled (if not using 2FA)');
        } else if (error.code === 'ECONNECTION') {
            console.log('🌐 Connection failed. Check:');
            console.log('   1. Internet connection');
            console.log('   2. Firewall settings');
            console.log('   3. EMAIL_SERVICE setting (gmail, outlook, etc.)');
        }
        
        return false;
    }
};

// Run the test
if (require.main === module) {
    testEmailConfiguration()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Unexpected error:', error.message);
            process.exit(1);
        });
}

module.exports = { testEmailConfiguration };
