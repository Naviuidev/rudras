<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Models\AuditLog;
use App\Models\Faq;
use App\Utils\Response;

class FaqController
{
    public function index(): void
    {
        AuthMiddleware::authenticate(true);
        Response::success(Faq::getAll());
    }

    public function publicList(): void
    {
        Response::success(Faq::getPublic());
    }

    public function store(): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['question']) || empty($input['answer'])) {
            Response::error('Question and answer required');
        }
        $id = Faq::create($input);
        AuditLog::log(null, 'create_faq', 'faq', $id);
        Response::success(['id' => $id], 'FAQ created', 201);
    }

    public function update(int $id): void
    {
        AuthMiddleware::authenticate(true);
        $input = json_decode(file_get_contents('php://input'), true);
        Faq::update($id, $input);
        Response::success(null, 'FAQ updated');
    }

    public function destroy(int $id): void
    {
        AuthMiddleware::authenticate(true);
        Faq::delete($id);
        Response::success(null, 'FAQ deleted');
    }
}
