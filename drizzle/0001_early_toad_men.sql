CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('violation','clear','unclear') NOT NULL,
	`headline` varchar(255) NOT NULL,
	`citation` varchar(100) NOT NULL DEFAULT '',
	`analysis` text NOT NULL,
	`severity` varchar(64) NOT NULL DEFAULT 'none',
	`maxPenalty` varchar(64) NOT NULL DEFAULT 'N/A',
	`confidence` int NOT NULL DEFAULT 0,
	`fullResult` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
