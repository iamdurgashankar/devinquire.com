<?php
require 'vendor/autoload.php';
require 'db.php';

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\SecureServer;
use React\Socket\Server;

class ChatWebSocket implements \Ratchet\MessageComponentInterface {
    protected $clients;
    protected $apiKey;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->apiKey = getenv('GEMINI_API_KEY');
        echo "Chat Server initialized!\n";
    }

    public function onOpen(\Ratchet\ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
        
        // Send welcome message
        $conn->send(json_encode([
            'type' => 'connection_status',
            'status' => 'connected',
            'message' => "Connected to AI Chat Server"
        ]));
    }

    public function onMessage(\Ratchet\ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);
        
        if (!isset($data['message'])) {
            return;
        }

        // Call Gemini API
        $response = $this->callGeminiAPI($data['message']);
        
        // Send response back to the client
        $from->send(json_encode([
            'type' => 'ai_response',
            'message' => $response
        ]));
    }

    protected function callGeminiAPI($message) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" . $this->apiKey;
        
        $payload = [
            "contents" => [
                [
                    "parts" => [
                        [
                            "text" => $message
                        ]
                    ]
                ]
            ],
            "generationConfig" => [
                "temperature" => 0.9,
                "topK" => 40,
                "topP" => 1,
                "maxOutputTokens" => 2048,
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $response = curl_exec($ch);
        $result = json_decode($response, true);
        
        if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return $result['candidates'][0]['content']['parts'][0]['text'];
        }
        
        return "I apologize, but I encountered an error. Please try again.";
    }

    public function onClose(\Ratchet\ConnectionInterface $conn) {
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}

// Run the WebSocket server
$loop = Factory::create();
$webSocket = new ChatWebSocket();
$wsServer = new WsServer($webSocket);
$server = IoServer::factory(
    new HttpServer($wsServer),
    8080
);

echo "WebSocket server running on port 8080...\n";
$server->run();
