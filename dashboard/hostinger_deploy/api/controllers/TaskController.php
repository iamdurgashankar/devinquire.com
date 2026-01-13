<?php

require_once __DIR__ . '/../services/FirestoreProxyService.php';

class TaskController {
    private $firestore;
    private $collection = 'tasks';

    public function __construct() {
        $this->firestore = new FirestoreProxyService();
    }

    public function index($user, $token) {
        try {
            // Forward the Bearer token
            $authToken = "Bearer $token";
            $tasks = $this->firestore->listDocuments($this->collection, $authToken);
            
            echo json_encode([
                'success' => true,
                'data' => $tasks
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function show($id, $user, $token) {
        try {
            $authToken = "Bearer $token";
            $task = $this->firestore->getDocument($this->collection, $id, $authToken);
            if (!$task) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Task not found']);
                return;
            }
            echo json_encode([
                'success' => true,
                'data' => $task
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function store($user, $token) {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }

            // Add metadata
            $input['createdBy'] = $user['uid'];
            if (!isset($input['createdAt'])) $input['createdAt'] = date('c');
            $input['updatedAt'] = date('c');

            $authToken = "Bearer $token";
            $task = $this->firestore->createDocument($this->collection, $input, $authToken);
            
            echo json_encode([
                'success' => true,
                'data' => $task
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function update($id, $user, $token) {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                throw new Exception('Invalid JSON input');
            }

            $input['updatedAt'] = date('c');
            $input['updatedBy'] = $user['uid'];

            $authToken = "Bearer $token";
            $task = $this->firestore->updateDocument($this->collection, $id, $input, $authToken);
            
            echo json_encode([
                'success' => true,
                'data' => $task
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function destroy($id, $user, $token) {
        try {
            $authToken = "Bearer $token";
            $this->firestore->deleteDocument($this->collection, $id, $authToken);
            
            echo json_encode([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}
