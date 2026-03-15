CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serviceId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileKey` varchar(1024) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(128),
	`uploadType` enum('client_source','admin_final') NOT NULL DEFAULT 'client_source',
	`aiAnalysis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`serviceId` int NOT NULL,
	`serviceName` varchar(256) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending_payment','paid','in_progress','revision','delivered','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`totalAmount` decimal(10,2) NOT NULL,
	`stripePaymentIntentId` varchar(256),
	`stripeCheckoutSessionId` varchar(256),
	`notes` text,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`artist` varchar(256) NOT NULL,
	`genre` varchar(128),
	`serviceType` enum('mixing','mastering','mixing_mastering') NOT NULL,
	`description` text,
	`coverImageUrl` text,
	`isPublished` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`category` enum('mixing','mastering','mixing_mastering') NOT NULL,
	`description` text NOT NULL,
	`shortDescription` varchar(512),
	`price` decimal(10,2) NOT NULL,
	`deliveryDays` int NOT NULL,
	`revisions` int NOT NULL DEFAULT 2,
	`features` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `services_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(256) NOT NULL,
	`clientRole` varchar(256),
	`content` text NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`serviceType` enum('mixing','mastering','mixing_mastering'),
	`isPublished` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`audioKey` varchar(1024) NOT NULL,
	`audioUrl` text NOT NULL,
	`transcription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);