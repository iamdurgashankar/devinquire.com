<?php
// ai_chat.php - Enhanced Gemini AI Integration

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- CONFIG ---
$apiKey = getenv('GEMINI_API_KEY'); // Get from environment variable
if (!$apiKey) {
    // Fallback for development - you should set GEMINI_API_KEY environment variable
    $apiKey = 'YOUR_GEMINI_API_KEY_HERE'; // Replace with your actual API key
}

if (!$apiKey || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    // Use fallback intelligent responses if no API key
    $useFallback = true;
} else {
    $useFallback = false;
    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" . $apiKey;
}

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
    echo json_encode(['success' => true, 'reply' => 'Conversation history has been reset. How can I help you today?']);
    exit;
}

// Add user message to history
$_SESSION['chat_history'][] = ['role' => 'user', 'parts' => [['text' => $userMessage]]];
// Keep only the last 20 messages for better context
$_SESSION['chat_history'] = array_slice($_SESSION['chat_history'], -20);

// --- Enhanced AI Response Logic ---
if ($useFallback) {
    // Enhanced fallback responses when API key is not available
    $aiReply = getIntelligentFallbackResponse($userMessage);
    $_SESSION['chat_history'][] = ['role' => 'model', 'parts' => [['text' => $aiReply]]];
    $_SESSION['chat_history'] = array_slice($_SESSION['chat_history'], -20);
    echo json_encode(['success' => true, 'reply' => $aiReply]);
    exit;
}

// --- Prepare Gemini API request ---
$systemPrompt = [
    'role' => 'user',
    'parts' => [[
        'text' => "You are DevInquire AI, an intelligent and helpful assistant for the DevInquire platform. You provide expert support for:\n\n🔹 Website navigation and features\n🔹 Blog creation and management\n🔹 User account assistance\n🔹 Technical troubleshooting\n🔹 General inquiries about DevInquire services\n\nYour personality:\n- Professional yet friendly and approachable\n- Clear, concise, and helpful responses\n- Use emojis appropriately to enhance communication\n- Provide step-by-step guidance when needed\n- If you don't know something specific about DevInquire, be honest and suggest contacting support\n\nAlways aim to be as helpful as Gemini, ChatGPT, or other leading AI assistants while maintaining focus on DevInquire-related topics."
    ]]
];

$contents = array_merge([$systemPrompt], $_SESSION['chat_history']);

$data = [
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.8,
        'topK' => 40,
        'topP' => 0.95,
        'maxOutputTokens' => 1024,
        'stopSequences' => []
    ],
    'safetySettings' => [
        [
            'category' => 'HARM_CATEGORY_HARASSMENT',
            'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
        ],
        [
            'category' => 'HARM_CATEGORY_HATE_SPEECH',
            'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'
        ]
    ]
];

// --- Make API request to Gemini ---
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    curl_close($ch);
    // Fallback to intelligent response on API error
    $aiReply = getIntelligentFallbackResponse($userMessage);
    $_SESSION['chat_history'][] = ['role' => 'model', 'parts' => [['text' => $aiReply]]];
    echo json_encode(['success' => true, 'reply' => $aiReply]);
    exit;
}
curl_close($ch);

// --- Parse Gemini response ---
$responseData = json_decode($response, true);

if ($httpCode !== 200 || !isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
    // Fallback to intelligent response on API error
    $aiReply = getIntelligentFallbackResponse($userMessage);
    $_SESSION['chat_history'][] = ['role' => 'model', 'parts' => [['text' => $aiReply]]];
    echo json_encode(['success' => true, 'reply' => $aiReply]);
    exit;
}

$aiReply = trim($responseData['candidates'][0]['content']['parts'][0]['text']);

// Add assistant reply to history
$_SESSION['chat_history'][] = ['role' => 'model', 'parts' => [['text' => $aiReply]]];
// Keep only the last 20 messages
$_SESSION['chat_history'] = array_slice($_SESSION['chat_history'], -20);

echo json_encode(['success' => true, 'reply' => $aiReply]);

// --- Enhanced Intelligent Fallback Function ---
function getIntelligentFallbackResponse($message) {
    $message = strtolower(trim($message));
    
    // Greeting responses
    if (preg_match('/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/', $message)) {
        $greetings = [
            "Hello! 👋 I'm DevInquire AI, your intelligent assistant. How can I help you today?",
            "Hi there! 😊 Welcome to DevInquire. I'm here to assist you with any questions you might have.",
            "Hey! 🌟 I'm your DevInquire AI assistant. What can I help you with?"
        ];
        return $greetings[array_rand($greetings)];
    }
    
    // Blog-related queries
    if (preg_match('/\b(blog|post|article|write|publish|content)\b/', $message)) {
        return "📝 **Blog Management Help:**\n\n• **Create a blog post:** Sign in as admin → Admin Panel → Blog Management → Create New Post\n• **Edit posts:** Go to Blog Management and click edit on any post\n• **Publish/Draft:** Use the status toggle when creating or editing\n• **Categories & Tags:** Add them while creating your post for better organization\n\nNeed more specific help with blogging? Feel free to ask! ✨";
    }
    
    // Account/Login related
    if (preg_match('/\b(login|signin|account|password|reset|forgot)\b/', $message)) {
        return "🔐 **Account & Login Help:**\n\n• **Login Issues:** Check your email/password combination\n• **Forgot Password:** Click 'Forgot Password?' on the login page\n• **Account Creation:** Use the signup form with valid email\n• **Admin Access:** Contact support if you need admin privileges\n\n💡 **Tip:** Clear your browser cache if you're experiencing login issues!";
    }
    
    // Technical support
    if (preg_match('/\b(error|bug|problem|issue|not working|broken|fix)\b/', $message)) {
        return "🔧 **Technical Support:**\n\nI understand you're experiencing an issue. Here are some quick troubleshooting steps:\n\n1. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)\n2. **Clear browser cache** and cookies\n3. **Try a different browser** or incognito mode\n4. **Check your internet connection**\n\nIf the problem persists, please contact our support team using the buttons below with details about:\n• What you were trying to do\n• What error message you saw\n• Your browser and device info\n\nWe're here to help! 💪";
    }
    
    // Contact/Support
    if (preg_match('/\b(contact|support|help|phone|email|whatsapp)\b/', $message)) {
        return "📞 **Contact DevInquire Support:**\n\nI'm here to help, but for complex issues or personal assistance, you can reach our human support team:\n\n• **💬 WhatsApp:** Quick chat support\n• **📞 Phone:** Direct call for urgent matters\n• **📧 Email:** Detailed support requests\n\nUse the contact buttons below this chat! Our team typically responds within a few hours. 🚀";
    }
    
    // Features/Services
    if (preg_match('/\b(features|services|what can|capabilities|about)\b/', $message)) {
        return "🌟 **DevInquire Platform Features:**\n\n• **📝 Blog Management:** Create, edit, and publish blog posts\n• **👥 User Management:** Admin controls for user accounts\n• **🎨 Modern Design:** Clean, responsive interface\n• **🔒 Secure Authentication:** Safe login and user management\n• **📱 Mobile Friendly:** Works great on all devices\n• **🤖 AI Support:** That's me! Your intelligent assistant\n\nWhat specific feature would you like to know more about?";
    }
    
    // Default intelligent response
    $responses = [
        "🤔 I understand you're asking about: \"$message\"\n\nWhile I'm designed to help with DevInquire-related questions, I might need more context to give you the best answer. Could you please:\n\n• Be more specific about what you need help with\n• Let me know if this is about blogging, accounts, or technical issues\n\nOr feel free to contact our support team using the buttons below! 😊",
        "💭 Thanks for your question! I'm DevInquire AI and I'm here to help with:\n\n• Blog and content management\n• Account and login assistance\n• Technical troubleshooting\n• Platform features and navigation\n\nCould you provide a bit more detail about what you're looking for? I'd love to give you a more targeted response! ✨",
        "🎯 I want to make sure I give you the most helpful response possible!\n\nI specialize in DevInquire platform support. Whether you need help with blogging, account management, or technical issues, I'm here for you.\n\nCould you rephrase your question or let me know what specific area you need assistance with? 🚀"
    ];
    
    return $responses[array_rand($responses)];
}
?>