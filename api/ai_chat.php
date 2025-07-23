<?php
// ai-chat.php

session_start();

header('Content-Type: application/json');

// --- CONFIG ---
$apiKey = getenv('GEMINI_API_KEY'); // Get from environment variable
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'API key not configured']);
    exit;
}
$endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" . $apiKey;

// --- Read user message from JSON POST ---
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['message']) || !trim($input['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No message provided']);
    exit;
}
$userMessage = trim($input['message']);

// --- Conversation history logic ---
if (!isset($_SESSION['chat_history'])) $_SESSION['chat_history'] = [];
if (strtolower($userMessage) === 'reset') {
    $_SESSION['chat_history'] = [];
    echo json_encode(['success' => true, 'reply' => 'Conversation history has been reset.']);
    exit;
}
// Add user message to history
$_SESSION['chat_history'][] = ['role' => 'user', 'content' => $userMessage];
// Keep only the last 10 messages (user+assistant)
$_SESSION['chat_history'] = array_slice($_SESSION['chat_history'], -10);

// --- Prepare DeepSeek API request ---
$messages = array_merge(
    [[
        'role' => 'system',
        'content' => "You are Devinquire's expert support AI. Answer user questions clearly and helpfully about the website, blogging, user accounts, and technical issues. If you don't know the answer, say so honestly. Always be friendly and concise."
    ]],
    $_SESSION['chat_history']
);

$data = [
    'contents' => [
        [
            'parts' => [
                [
                    'text' => implode("\n", array_map(function($msg) {
                        return ($msg['role'] === 'user' ? 'User: ' : 'Assistant: ') . $msg['content'];
                    }, $messages))
                ]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.9,
        'topK' => 40,
        'topP' => 1,
        'maxOutputTokens' => 2048,
    ]
];

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(['success' => false, 'message' => curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

// --- Log the full DeepSeek response for debugging ---
file_put_contents('/tmp/deepseek_debug.log', print_r($response, true) . "\n", FILE_APPEND);

// --- Parse DeepSeek response and return only the assistant's reply ---
$data = json_decode($response, true);
if (!isset($data['choices'][0]['message']['content'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'No response from AI']);
    exit;
}
$aiReply = trim($data['choices'][0]['message']['content']);
// Add assistant reply to history
$_SESSION['chat_history'][] = ['role' => 'assistant', 'content' => $aiReply];
// Keep only the last 10 messages
$_SESSION['chat_history'] = array_slice($_SESSION['chat_history'], -10);
echo json_encode(['success' => true, 'reply' => $aiReply]);
?> 