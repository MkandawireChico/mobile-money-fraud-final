// client/src/components/settings/WebhookTest.tsx
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios.ts';
import { Send, CheckCircle, XCircle, Globe } from 'lucide-react';

interface WebhookTestProps {
    settings: {
        webhook_url?: string;
        webhook_secret?: string;
    };
    onSettingsChange: (newValues: any) => void;
    webhookUrl?: string;
    onSave?: (values: any) => Promise<void>;
    isReadOnly: boolean;
}

const WebhookTest: React.FC<WebhookTestProps> = ({ webhookUrl: initialWebhookUrl = '', isReadOnly }) => {
    const [webhookUrl, setWebhookUrl] = useState<string>(initialWebhookUrl);
    const [payload, setPayload] = useState<string>(
        `{\n  "event": "test_alert",\n  "data": {\n    "alertId": "ALERT-TEST-123",\n    "riskScore": 85,\n    "message": "This is a test webhook payload from the fraud detection system.",\n    "timestamp": "${new Date().toISOString()}"\n  }\n}`
    );
    const [testLoading, setTestLoading] = useState<boolean>(false);
    const [testResponse, setTestResponse] = useState<any>(null);
    const [testError, setTestError] = useState<string | null>(null);

    useEffect(() => {
        if (initialWebhookUrl) {
            setWebhookUrl(initialWebhookUrl);
        }
    }, [initialWebhookUrl]);

    const handleSendTest = async () => {
        if (isReadOnly) return;

        setTestLoading(true);
        setTestResponse(null);
        setTestError(null);

        try {
            let parsedPayload;
            try {
                parsedPayload = JSON.parse(payload);
                // Validate payload structure
                if (!parsedPayload.event || !parsedPayload.data) {
                    throw new Error('Payload must contain "event" and "data" fields.');
                }
            } catch (parseError: any) {
                throw new Error(`Invalid JSON payload: ${parseError.message}`);
            }

            const response = await axios.post('/api/notifications/test-webhook', {
                url: webhookUrl,
                payload: parsedPayload,
            });
            setTestResponse(response.data);
            console.log('Webhook test successful:', response.data);
        } catch (err: any) {
            setTestError(err.response?.data?.message || err.message || 'An unknown error occurred during webhook test.');
            console.error('Error sending test webhook:', err);
        } finally {
            setTestLoading(false);
        }
    };

    const handleRetryTest = () => {
        setTestResponse(null);
        setTestError(null);
        handleSendTest();
    };

    return (
        <div className="p-3 bg-white rounded-lg shadow-md mb-3">
            <h2 className="text-xl font-semibold mb-2 flex items-center">
                Test Webhook Endpoint
                <Globe className="h-5 w-5 ml-2" />
            </h2>
            <div className="grid gap-3">
                <div>
                    <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Webhook URL</label>
                    <input
                        id="webhookUrl"
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => { if (!isReadOnly) setWebhookUrl(e.target.value); }}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., https://api.example.com/webhook"
                        disabled={isReadOnly}
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter the URL of the endpoint you wish to test (e.g., a Slack webhook, custom API endpoint). This system will make a POST request to this URL.</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Webhook Payload (JSON)</p>
                    <textarea
                        rows={8}
                        style={{ minHeight: '150px' }}
                        value={payload}
                        onChange={(e) => { if (!isReadOnly) setPayload(e.target.value); }}
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical disabled:bg-gray-200 disabled:text-gray-500"
                        placeholder="Enter JSON payload..."
                        disabled={isReadOnly}
                    />
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={handleSendTest}
                            disabled={testLoading || isReadOnly || !webhookUrl.trim() || !payload.trim()}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center relative"
                        >
                            {testLoading ? (
                                <>
                                    Sending...
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ marginTop: '-12px', marginLeft: '-12px' }}></div>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-1" /> Send Test Webhook
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-2">Test Response</h3>
                    <div className="bg-gray-50 border border-gray-300 p-2 rounded min-h-[150px] overflow-x-auto text-sm font-mono text-gray-900">
                        {testLoading && (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-4 border-blue-500"></div>
                                <p className="ml-2 text-gray-600">Testing webhook...</p>
                            </div>
                        )}
                        {testError && (
                            <div className="flex items-center mt-2 text-red-600">
                                <XCircle className="h-5 w-5 mr-1" />
                                <p>Error: {testError}</p>
                                <button
                                    onClick={handleRetryTest}
                                    className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {testResponse && (
                            <>
                                <div className="flex items-center mt-2 text-green-600">
                                    <CheckCircle className="h-5 w-5 mr-1" />
                                    <p>Webhook Test Succeeded!</p>
                                </div>
                                <pre className="mt-2">{JSON.stringify(testResponse, null, 2)}</pre>
                            </>
                        )}
                        {!testLoading && !testResponse && !testError && (
                            <p className="text-gray-500 text-sm">Enter a webhook URL and payload, then click 'Send Test Webhook' to see the response here.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebhookTest;