// client/src/components/settings/NotificationPreview.tsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios.ts';
import { Mail, Smartphone, Globe, Send, CheckCircle2, XCircle, Copy } from 'lucide-react';

interface NotificationPreviewProps {
    settings: {
        template_type?: string;
        preview_message?: string;
        recipient_email?: string;
        recipient_phone?: string;
    };
    onSettingsChange: (newValues: any) => void;
    isReadOnly: boolean;
}

const NotificationPreview: React.FC<NotificationPreviewProps> = ({ settings: initialSettings, onSettingsChange, isReadOnly }) => {
    const [channel, setChannel] = useState<'email' | 'sms' | 'webhook'>(initialSettings.template_type as 'email' | 'sms' | 'webhook' || 'email');
    const [recipient, setRecipient] = useState<string>(initialSettings.recipient_email || initialSettings.recipient_phone || '');
    const [subject, setSubject] = useState<string>('Test Notification from Fraud System');
    const [message, setMessage] = useState<string>(initialSettings.preview_message || 'This is a test notification generated from the system settings page.\n\nRisk Score: 75\nTransaction ID: TXN123456');
    const [testLoading, setTestLoading] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);
    const [testMessage, setTestMessage] = useState<string>('');

    useEffect(() => {
        if (initialSettings) {
            setChannel(initialSettings.template_type as 'email' | 'sms' | 'webhook' || 'email');
            setRecipient(initialSettings.recipient_email || initialSettings.recipient_phone || '');
            setMessage(initialSettings.preview_message || 'This is a test notification generated from the system settings page.\n\nRisk Score: 75\nTransaction ID: TXN123456');
        }
    }, [initialSettings]);

    const handleSendTest = async () => {
        if (isReadOnly) return;

        setTestLoading(true);
        setTestResult(null);
        setTestMessage('');

        try {
            const payload: any = {
                channel,
                recipient,
                message,
            };
            if (channel === 'email') {
                payload.subject = subject;
            }

            await axios.post('/api/notifications/test', payload);
            setTestResult('success');
            setTestMessage('Test notification sent successfully!');
        } catch (err: any) {
            setTestResult('failure');
            setTestMessage(`Failed to send test notification: ${err.response?.data?.message || err.message}`);
            console.error('Error sending test notification:', err);
        } finally {
            setTestLoading(false);
        }
    };

    const handleRetryTest = () => {
        setTestResult(null);
        setTestMessage('');
        handleSendTest();
    };

    const handleCopyWebhookPayload = () => {
        const payload = `{\n  "channel": "${channel}",\n  "recipient": "${recipient || 'your_webhook_url'}",\n  "subject": "${subject}",\n  "message": "${message.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"\n}`;
        navigator.clipboard.writeText(payload);
        setTestMessage('Webhook payload copied to clipboard!');
        setTestResult('success');
    };

    return (
        <div className="p-3 bg-white rounded-lg shadow-md mb-3">
            <h2 className="text-xl font-semibold mb-2">Test & Preview Notifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="channel-select" className="block text-sm font-medium text-gray-700 mb-2">Notification Channel</label>
                    <select
                        id="channel-select"
                        value={channel}
                        onChange={(e) => { if (!isReadOnly) setChannel(e.target.value as 'email' | 'sms' | 'webhook'); }}
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                        disabled={isReadOnly}
                    >
                        <option value="email">
                            <Mail className="h-4 w-4 mr-2 inline" /> Email
                        </option>
                        <option value="sms">
                            <Smartphone className="h-4 w-4 mr-2 inline" /> SMS
                        </option>
                        <option value="webhook">
                            <Globe className="h-4 w-4 mr-2 inline" /> Webhook
                        </option>
                    </select>

                    {channel === 'email' && (
                        <div className="mt-2">
                            <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700">Recipient Email</label>
                            <input
                                id="recipient-email"
                                type="text"
                                value={recipient}
                                onChange={(e) => { if (!isReadOnly) setRecipient(e.target.value); }}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                placeholder="e.g., user@example.com"
                                disabled={isReadOnly}
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter the email address to send the test notification.</p>
                        </div>
                    )}
                    {channel === 'sms' && (
                        <div className="mt-2">
                            <label htmlFor="recipient-phone" className="block text-sm font-medium text-gray-700">Recipient Phone Number (MSISDN)</label>
                            <input
                                id="recipient-phone"
                                type="text"
                                value={recipient}
                                onChange={(e) => { if (!isReadOnly) setRecipient(e.target.value); }}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                placeholder="e.g., +265XXXXXXXXX"
                                disabled={isReadOnly}
                            />
                            <p className="mt-1 text-xs text-gray-500">Enter the phone number (MSISDN) to send the test SMS.</p>
                        </div>
                    )}
                    {channel === 'webhook' && (
                        <div className="mt-2">
                            <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700">Webhook URL</label>
                            <input
                                id="webhook-url"
                                type="text"
                                value={recipient}
                                onChange={(e) => { if (!isReadOnly) setRecipient(e.target.value); }}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                placeholder="e.g., https://your-webhook-endpoint.com/receive"
                                disabled={isReadOnly}
                            />
                            <p className="mt-1 text-xs text-gray-500">This should be an active webhook endpoint to receive test data.</p>
                        </div>
                    )}

                    {channel === 'email' && (
                        <div className="mt-2">
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                id="subject"
                                type="text"
                                value={subject}
                                onChange={(e) => { if (!isReadOnly) setSubject(e.target.value); }}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                                disabled={isReadOnly}
                            />
                            <p className="mt-1 text-xs text-gray-500">The subject line of the test email.</p>
                        </div>
                    )}

                    <div className="mt-2">
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message Content</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => { if (!isReadOnly) setMessage(e.target.value); }}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                            rows={6}
                            disabled={isReadOnly}
                        />
                        <p className="mt-1 text-xs text-gray-500">The body of your test notification. Markdown is generally not supported for SMS/Webhooks directly.</p>
                    </div>

                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={handleSendTest}
                            disabled={testLoading || isReadOnly || !recipient || !message}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center relative"
                        >
                            {testLoading ? (
                                <>
                                    Sending...
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ marginTop: '-12px', marginLeft: '-12px' }}></div>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-1" /> Send Test Notification
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-2">Notification Preview</h3>
                    <div className="bg-gray-50 border border-gray-300 p-2 rounded min-h-[150px] overflow-x-auto whitespace-pre-wrap break-words">
                        {channel === 'email' && (
                            <>
                                <p className="text-sm font-medium">To: <strong>{recipient || '[Recipient Email]'}</strong></p>
                                <p className="text-sm font-medium">Subject: <strong>{subject || '[No Subject]'}</strong></p>
                                <hr className="my-2 border-gray-300" />
                                <p className="text-sm">{message}</p>
                            </>
                        )}
                        {channel === 'sms' && (
                            <>
                                <p className="text-sm font-medium">To: <strong>{recipient || '[Recipient Phone]'}</strong></p>
                                <hr className="my-2 border-gray-300" />
                                <p className="text-sm">{message}</p>
                            </>
                        )}
                        {channel === 'webhook' && (
                            <>
                                <p className="text-sm font-medium">Target URL: <strong>{recipient || '[Webhook URL]'}</strong></p>
                                <hr className="my-2 border-gray-300" />
                                <pre className="text-sm font-mono">
                                    {`{\n  "channel": "${channel}",\n  "recipient": "${recipient || 'your_webhook_url'}",\n  "subject": "${subject}",\n  "message": "${message.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"\n}`}
                                </pre>
                                <button
                                    onClick={handleCopyWebhookPayload}
                                    className="mt-2 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs flex items-center"
                                >
                                    <Copy className="h-3 w-3 mr-1" /> Copy Payload
                                </button>
                            </>
                        )}
                    </div>
                    {testResult && (
                        <div className={`mt-2 flex items-center ${testResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {testResult === 'success' ? <CheckCircle2 className="h-5 w-5 mr-1" /> : <XCircle className="h-5 w-5 mr-1" />}
                            <p className="text-sm">{testMessage}</p>
                            {testResult === 'failure' && (
                                <button
                                    onClick={handleRetryTest}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPreview;