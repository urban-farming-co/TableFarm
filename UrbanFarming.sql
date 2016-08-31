SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

DROP SCHEMA IF EXISTS `tablefarming` ;
CREATE SCHEMA IF NOT EXISTS `tablefarming` DEFAULT CHARACTER SET latin1 ;
USE `tablefarming` ;

-- -----------------------------------------------------
-- Table `tablefarming`.`plant_projects`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`plant_projects` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`plant_projects` (
  `uid` INT(11) NOT NULL,
  `user_name` VARCHAR(255) NULL DEFAULT NULL,
  `project_name` VARCHAR(255) NULL DEFAULT NULL,
  `timestamp` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`ambient_environment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`ambient_environment` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`ambient_environment` (
  `uid` CHAR(10) CHARACTER SET 'utf8' NOT NULL,
  `name` CHAR(10) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `relative_humidity` DECIMAL(18,0) NULL DEFAULT NULL,
  `room_temperature` DECIMAL(18,0) NULL DEFAULT NULL,
  `lighting_level` DECIMAL(18,0) NULL DEFAULT NULL,
  `project_uid` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_ambient_environment_plant_projects` (`project_uid` ASC),
  CONSTRAINT `FK_ambient_environment_plant_projects`
    FOREIGN KEY (`project_uid`)
    REFERENCES `tablefarming`.`plant_projects` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`control_sytem`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`control_sytem` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`control_sytem` (
  `uid` INT(11) NOT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `timestamp` DATETIME NULL DEFAULT NULL,
  `project_uid` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_Control_sytem_plant_projects` (`project_uid` ASC),
  CONSTRAINT `FK_Control_sytem_plant_projects`
    FOREIGN KEY (`project_uid`)
    REFERENCES `tablefarming`.`plant_projects` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`irrigation`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`irrigation` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`irrigation` (
  `uid` INT(11) NOT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `growth_medium_moisture` INT(11) NULL DEFAULT NULL,
  `control_system_uid` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_irrigation_Control_sytem` (`control_system_uid` ASC),
  CONSTRAINT `FK_irrigation_Control_sytem`
    FOREIGN KEY (`control_system_uid`)
    REFERENCES `tablefarming`.`control_sytem` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`lighting`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`lighting` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`lighting` (
  `uid` INT(11) NOT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `type` VARCHAR(50) NULL DEFAULT NULL,
  `intensity` INT(11) NULL DEFAULT NULL,
  `start_time` DATETIME NULL DEFAULT NULL,
  `end_time` DATETIME NULL DEFAULT NULL,
  `sunlight_angle` INT(11) NULL DEFAULT NULL,
  `natural_sunlight` DECIMAL(18,0) NULL DEFAULT NULL,
  `control_system_uid` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_lighting_Control_sytem` (`control_system_uid` ASC),
  CONSTRAINT `FK_lighting_Control_sytem`
    FOREIGN KEY (`control_system_uid`)
    REFERENCES `tablefarming`.`control_sytem` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`plant_characteristics`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`plant_characteristics` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`plant_characteristics` (
  `uid` INT(11) NOT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `growth_rate` DECIMAL(18,0) NULL DEFAULT NULL,
  `taste` VARCHAR(25) NULL DEFAULT NULL,
  `smell` VARCHAR(255) NULL DEFAULT NULL,
  `project_uid` INT(11) NULL DEFAULT NULL,
  `timestamp` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_Plant_Characteristics_plant_projects` (`project_uid` ASC),
  CONSTRAINT `FK_Plant_Characteristics_plant_projects`
    FOREIGN KEY (`project_uid`)
    REFERENCES `tablefarming`.`plant_projects` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`plant_phenotype`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`plant_phenotype` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`plant_phenotype` (
  `uid` INT(11) NOT NULL DEFAULT '0',
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `leaf_number` INT(11) NULL DEFAULT NULL,
  `flower_number` INT(11) NULL DEFAULT NULL,
  `fruit` INT(11) NULL DEFAULT NULL,
  `stem_length` DECIMAL(18,0) NULL DEFAULT NULL,
  `stem_number` INT(11) NULL DEFAULT NULL,
  `colour` VARCHAR(255) NULL DEFAULT NULL,
  `plant_characterist_uid` INT(11) NULL DEFAULT NULL,
  `timestamp` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`pump`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`pump` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`pump` (
  `uid` INT(11) NOT NULL,
  `name` VARCHAR(255) NULL DEFAULT NULL,
  `start_time` CHAR(10) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `end_time` CHAR(10) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `irrigation_uid` INT(11) NULL DEFAULT NULL,
  `run_mode` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_pump_irrigation` (`irrigation_uid` ASC),
  CONSTRAINT `FK_pump_irrigation`
    FOREIGN KEY (`irrigation_uid`)
    REFERENCES `tablefarming`.`irrigation` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


-- -----------------------------------------------------
-- Table `tablefarming`.`water_reservoir`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tablefarming`.`water_reservoir` ;

CREATE TABLE IF NOT EXISTS `tablefarming`.`water_reservoir` (
  `uid` INT(11) NOT NULL,
  `name` CHAR(10) CHARACTER SET 'utf8' NULL DEFAULT NULL,
  `fill_level` INT(11) NULL DEFAULT NULL,
  `control_system_uid` INT(11) NULL DEFAULT NULL,
  PRIMARY KEY (`uid`),
  INDEX `FK_Water_reservoir_Control_sytem` (`control_system_uid` ASC),
  CONSTRAINT `FK_Water_reservoir_Control_sytem`
    FOREIGN KEY (`control_system_uid`)
    REFERENCES `tablefarming`.`control_sytem` (`uid`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
