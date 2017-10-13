CREATE TABLE users
(
id int NOT NULL AUTO_INCREMENT,
user varchar(255) NOT NULL,
complete int NOT NULL,
track_count int NOT NULL,
total_tracks int NOT NULL,
PRIMARY KEY (id)
);

CREATE TABLE user_libraries
(
id int NOT NULL AUTO_INCREMENT,
user varchar(255) NOT NULL,
title varchar(255) NOT NULL,
artist varchar(255) NOT NULL,
album varchar(255) NOT NULL,
playcount int NOT NULL,
art_lg varchar(255) NOT NULL,
art_md varchar(255) NOT NULL,
art_sm varchar(255) NOT NULL,
track_id varchar(255) NOT NULL,
album_id varchar(255) NOT NULL,
tags varchar(255) NOT NULL,
PRIMARY KEY (id)
);