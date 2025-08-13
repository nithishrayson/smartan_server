import sys
import json
import cv2
import mediapipe as mp

def extract_keypoints(image_path):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True)
    image = cv2.imread(image_path)

    if image is None:
        print(json.dumps({"error": "Image not found"}))
        sys.exit(1)

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if not results.pose_landmarks:
        print(json.dumps({"keypoints": []}))
        return

    height, width, _ = image.shape
    keypoints = []

    for i, landmark in enumerate(results.pose_landmarks.landmark):
        keypoints.append({
            "name": mp_pose.PoseLandmark(i).name,
            "x": round(landmark.x * width, 2),
            "y": round(landmark.y * height, 2),
            "score": round(landmark.visibility, 2)
        })

    print(json.dumps({"keypoints": keypoints}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    extract_keypoints(sys.argv[1])