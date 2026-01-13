<?php

require_once __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class FirestoreProxyService {
    private $client;
    private $projectId;
    private $baseUrl;

    public function __construct() {
        $this->projectId = $_ENV['FIREBASE_PROJECT_ID'] ?? null;
        if (!$this->projectId) {
            // Fallback for development if env not populated yet
            if (file_exists(__DIR__ . '/../.env')) {
                $env = parse_ini_file(__DIR__ . '/../.env');
                $this->projectId = $env['FIREBASE_PROJECT_ID'] ?? null;
            }
        }
        
        if (!$this->projectId) {
            throw new Exception('FIREBASE_PROJECT_ID not set in environment');
        }
        
        $this->baseUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents";
        $this->client = new Client();
    }

    // Helper to wrap standard JSON into Firestore format
    private function toFirestoreValue($value) {
        if (is_null($value)) return ['nullValue' => null];
        if (is_bool($value)) return ['booleanValue' => $value];
        if (is_int($value)) return ['integerValue' => (string)$value];
        if (is_float($value)) return ['doubleValue' => $value];
        if (is_string($value)) return ['stringValue' => $value];
        if (is_array($value)) {
            if (empty($value)) {
                return ['arrayValue' => ['values' => []]];
            }
            // Check if associative (map) or sequential (array)
            $isAssoc = array_keys($value) !== range(0, count($value) - 1);
            if ($isAssoc) {
                $fields = [];
                foreach ($value as $k => $v) {
                    $fields[$k] = $this->toFirestoreValue($v);
                }
                return ['mapValue' => ['fields' => $fields]];
            } else {
                $values = [];
                foreach ($value as $v) {
                    $values[] = $this->toFirestoreValue($v);
                }
                return ['arrayValue' => ['values' => $values]];
            }
        }
        return ['stringValue' => (string)$value];
    }

    private function toFirestoreDocument($data) {
        $fields = [];
        foreach ($data as $key => $value) {
            $fields[$key] = $this->toFirestoreValue($value);
        }
        return ['fields' => $fields];
    }

    // Helper to unwrap Firestore format to standard JSON
    private function fromFirestoreValue($value) {
        if (isset($value['nullValue'])) return null;
        if (isset($value['booleanValue'])) return $value['booleanValue'];
        if (isset($value['integerValue'])) return (int)$value['integerValue'];
        if (isset($value['doubleValue'])) return (float)$value['doubleValue'];
        if (isset($value['stringValue'])) return $value['stringValue'];
        if (isset($value['mapValue'])) {
            $fields = $value['mapValue']['fields'] ?? [];
            $result = [];
            foreach ($fields as $k => $v) {
                $result[$k] = $this->fromFirestoreValue($v);
            }
            return $result;
        }
        if (isset($value['arrayValue'])) {
            $values = $value['arrayValue']['values'] ?? [];
            return array_map([$this, 'fromFirestoreValue'], $values);
        }
        if (isset($value['timestampValue'])) return $value['timestampValue'];
        return null;
    }

    public function fromFirestoreDocument($doc) {
        if (!isset($doc['fields'])) {
            // If just name (deleted) or error
            if (isset($doc['name'])) {
                 $parts = explode('/', $doc['name']);
                 return ['id' => end($parts)];
            }
            return [];
        }
        
        $data = [];
        foreach ($doc['fields'] as $key => $value) {
            $data[$key] = $this->fromFirestoreValue($value);
        }
        // Add ID if available in name
        if (isset($doc['name'])) {
            $parts = explode('/', $doc['name']);
            $data['id'] = end($parts);
        }
        // Add createTime/updateTime if needed
        if (isset($doc['createTime'])) $data['createdAt'] = $doc['createTime'];
        if (isset($doc['updateTime'])) $data['updatedAt'] = $doc['updateTime'];
        
        return $data;
    }

    // API Methods

    public function listDocuments($collection, $authToken) {
        try {
            $response = $this->client->get("{$this->baseUrl}/{$collection}", [
                'headers' => [
                    'Authorization' => $authToken,
                    'Accept' => 'application/json'
                ]
            ]);
            $body = json_decode($response->getBody(), true);
            $documents = $body['documents'] ?? [];
            return array_map([$this, 'fromFirestoreDocument'], $documents);
        } catch (RequestException $e) {
            // If 404, return empty array? No, 404 means collection might not exist or empty
            if ($e->hasResponse() && $e->getResponse()->getStatusCode() == 404) {
                return [];
            }
            throw new Exception($e->getMessage());
        }
    }

    public function getDocument($collection, $id, $authToken) {
        try {
            $response = $this->client->get("{$this->baseUrl}/{$collection}/{$id}", [
                'headers' => [
                    'Authorization' => $authToken,
                    'Accept' => 'application/json'
                ]
            ]);
            return $this->fromFirestoreDocument(json_decode($response->getBody(), true));
        } catch (RequestException $e) {
             if ($e->hasResponse() && $e->getResponse()->getStatusCode() == 404) {
                return null;
            }
            throw new Exception($e->getMessage());
        }
    }

    public function createDocument($collection, $data, $authToken, $id = null) {
        try {
            $firestoreData = $this->toFirestoreDocument($data);
            $url = "{$this->baseUrl}/{$collection}";
            $options = [
                'headers' => [
                    'Authorization' => $authToken,
                    'Content-Type' => 'application/json'
                ],
                'json' => $firestoreData
            ];
            
            if ($id) {
                $url .= "?documentId={$id}";
            }

            $response = $this->client->post($url, $options);
            return $this->fromFirestoreDocument(json_decode($response->getBody(), true));
        } catch (RequestException $e) {
            // Log full error for debugging
            if ($e->hasResponse()) {
                 $err = $e->getResponse()->getBody()->getContents();
                 throw new Exception("Firestore Create Error: " . $err);
            }
            throw new Exception($e->getMessage());
        }
    }

    public function updateDocument($collection, $id, $data, $authToken) {
        try {
            $firestoreData = $this->toFirestoreDocument($data);
            
            // Construct updateMask
            $fieldPaths = array_keys($data);
            $mask = "";
            foreach($fieldPaths as $path) {
                $mask .= "&updateMask.fieldPaths=" . $path;
            }
            
            $url = "{$this->baseUrl}/{$collection}/{$id}?{$mask}";
            
            $response = $this->client->patch($url, [
                'headers' => [
                    'Authorization' => $authToken,
                    'Content-Type' => 'application/json'
                ],
                'json' => $firestoreData
            ]);
            return $this->fromFirestoreDocument(json_decode($response->getBody(), true));
        } catch (RequestException $e) {
             if ($e->hasResponse()) {
                 $err = $e->getResponse()->getBody()->getContents();
                 throw new Exception("Firestore Update Error: " . $err);
            }
            throw new Exception($e->getMessage());
        }
    }

    public function deleteDocument($collection, $id, $authToken) {
        try {
            $this->client->delete("{$this->baseUrl}/{$collection}/{$id}", [
                'headers' => ['Authorization' => $authToken]
            ]);
            return true;
        } catch (RequestException $e) {
            throw new Exception($e->getMessage());
        }
    }
}
