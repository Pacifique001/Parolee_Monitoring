<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SendPasswordResetOtp extends Notification //implements ShouldQueue
{
    use Queueable;

    public string $otp;
    public int $expiresInMinutes;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $otp, int $expiresInMinutes)
    {
        $this->otp = $otp;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject(config('app.name') . ' - Password Reset OTP')
                    ->line('You are receiving this email because we received a password reset request for your account.')
                    ->line('Your One-Time Password (OTP) is: ' . $this->otp)
                    ->line('This OTP will expire in ' . $this->expiresInMinutes . ' minutes.')
                    ->line('If you did not request a password reset, no further action is required.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'otp' => $this->otp, // For other channels if needed
        ];
    }
}