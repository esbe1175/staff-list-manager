// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use tauri_plugin_fs::FsExt;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::{ImageFormat, GenericImageView};

#[derive(Debug, Serialize, Deserialize)]
struct StaffMember {
    name: String,
    job_title: Option<String>,
    image_path: String,
    is_intern: bool,
}

#[tauri::command]
async fn read_staff_images(app_handle: tauri::AppHandle, directory: String) -> Result<Vec<StaffMember>, String> {
    let path = Path::new(&directory);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    // Allow access to the directory
    let scope = app_handle.fs_scope();
    scope.allow_directory(&directory, true).map_err(|e| e.to_string())?;

    let mut staff_members = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if let Some(extension) = path.extension() {
            if matches!(extension.to_str(), Some("jpg") | Some("jpeg") | Some("png")) {
                if let Some(file_name) = path.file_stem() {
                    if let Some(name_str) = file_name.to_str() {
                        let (name, job_title) = parse_filename(name_str);
                        let image_path = path.to_string_lossy().to_string();
                        
                        // Allow access to the specific file
                        scope.allow_file(&image_path).map_err(|e| e.to_string())?;
                        
                        staff_members.push(StaffMember {
                            name,
                            job_title,
                            image_path,
                            is_intern: false,
                        });
                    }
                }
            }
        }
    }

    Ok(staff_members)
}

#[tauri::command]
async fn get_image_data(image_path: String) -> Result<String, String> {
    let path = Path::new(&image_path);
    
    if !path.exists() {
        return Err("Image file does not exist".to_string());
    }

    // Load and resize the image
    let img = image::open(path).map_err(|e| e.to_string())?;
    
    // Calculate optimal size (max 400px width/height to reduce memory usage)
    let (width, height) = img.dimensions();
    let max_dimension = 400u32;
    
    let resized_img = if width > max_dimension || height > max_dimension {
        if width > height {
            img.resize(max_dimension, (max_dimension * height) / width, image::imageops::FilterType::Lanczos3)
        } else {
            img.resize((max_dimension * width) / height, max_dimension, image::imageops::FilterType::Lanczos3)
        }
    } else {
        img
    };
    
    // Convert to JPEG with quality 85 for smaller file size
    let mut buffer = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut buffer);
    
    resized_img.write_to(&mut cursor, ImageFormat::Jpeg).map_err(|e| e.to_string())?;
    
    let base64_data = STANDARD.encode(&buffer);
    Ok(format!("data:image/jpeg;base64,{}", base64_data))
}

fn parse_filename(filename: &str) -> (String, Option<String>) {
    if let Some(dash_pos) = filename.rfind(" - ") {
        let name_part = &filename[..dash_pos];
        let job_title = &filename[dash_pos + 3..];
        (name_part.to_string(), Some(job_title.to_string()))
    } else {
        (filename.to_string(), None)
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_staff_images, get_image_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}