const btnOpenCam = document.getElementById('btnOpenCam');
const btnTakePhoto = document.getElementById('btnTakePhoto');
const btnAnalyzePhoto = document.getElementById('btnAnalyzePhoto');
const cameraPreview = document.getElementById('cameraPreview');
const photoResult = document.getElementById('photoResult');
const snapshotCanvas = document.getElementById('snapshotCanvas');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultBox = document.getElementById('resultBox');
const descriptionText = document.getElementById('descriptionText');
const photoUpload = document.getElementById('photoUpload');

let stream;

// CAMERA BUTTONS
btnOpenCam.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraPreview.srcObject = stream;
        cameraPreview.style.display = 'block';
        btnTakePhoto.style.display = 'inline-block';
        btnOpenCam.style.display = 'none';
        photoResult.style.display = 'none';
    } catch (err) {
        alert('Could not access camera: ' + err.message);
    }
});

btnTakePhoto.addEventListener('click', () => {
    const canvas = snapshotCanvas;
    const video = cameraPreview;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Show captured photo
    photoResult.src = canvas.toDataURL('image/jpeg');
    photoResult.style.display = 'block';

    // Stop camera
    stream.getTracks().forEach(track => track.stop());
    cameraPreview.style.display = 'none';
    btnTakePhoto.style.display = 'none';
    btnAnalyzePhoto.style.display = 'inline-block';
});

// UPLOAD PHOTO PREVIEW
photoUpload.addEventListener('change', () => {
    const file = photoUpload.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        photoResult.src = e.target.result;
        photoResult.style.display = 'block';
        btnAnalyzePhoto.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
});

// ANALYZE PHOTO
btnAnalyzePhoto.addEventListener('click', async () => {
    let dataUrl = photoResult.src;
    if (!dataUrl) return;

    // Convert base64 to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('photo', blob, 'capture.jpg');

    loadingIndicator.style.display = 'block';

    try {
        const response = await fetch('/AI/AnalyzePhoto', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        loadingIndicator.style.display = 'none';

        if (result.success) {
            // Display annotated image
            photoResult.src = result.annotatedImage;

            // Show detections summary
            const descriptions = result.detections
                .map(d => `${d.Label} (${d.Confidence}%)`)
                .join(', ');

            descriptionText.textContent = descriptions || 'No objects detected';
            resultBox.style.display = 'block';
        } else {
            alert(result.message);
        }
    } catch (err) {
        loadingIndicator.style.display = 'none';
        alert('Error analyzing photo: ' + err.message);
    }
});