<?php

declare(strict_types=1);

namespace App\Modules\Appointments;

/**
 * Thrown when the requested slot is already fully booked at insert time.
 * Maps to HTTP 409 (see AppointmentController).
 */
final class SlotTakenException extends \RuntimeException
{
}
