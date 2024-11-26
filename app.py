from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
import random

app = Flask(__name__)

# Mediapipe إعداد
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(model_complexity=0, min_detection_confidence=0.5, min_tracking_confidence=0.5)

# خيارات اللعبة
cpu_choices = ["Rock", "Paper", "Scissors"]
cpu_choice = "Nothing"
player_choice = "Nothing"
winner = "None"
player_score = 0
cpu_score = 0


def detect_gesture(image):
    """تحليل الإيماءة باستخدام Mediapipe"""
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            thumb_is_open = hand_landmarks.landmark[4].x > hand_landmarks.landmark[3].x
            index_is_open = hand_landmarks.landmark[8].y < hand_landmarks.landmark[6].y
            middle_is_open = hand_landmarks.landmark[12].y < hand_landmarks.landmark[10].y
            ring_is_open = hand_landmarks.landmark[16].y < hand_landmarks.landmark[14].y
            pinky_is_open = hand_landmarks.landmark[20].y < hand_landmarks.landmark[18].y

            if thumb_is_open and not index_is_open and not middle_is_open and not ring_is_open and not pinky_is_open:
                return "Rock"
            elif index_is_open and middle_is_open and not ring_is_open and not pinky_is_open:
                return "Scissors"
            elif index_is_open and middle_is_open and ring_is_open and pinky_is_open:
                return "Paper"
    return "Nothing"


@app.route('/')
def index():
    """عرض الصفحة الرئيسية"""
    return render_template('index.html')


@app.route('/detect', methods=['POST'])
def detect():
    """كشف الإيماءة من صورة مرسلة من العميل"""
    global player_choice
    file = request.files['frame']
    img = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(img, cv2.IMREAD_COLOR)

    player_choice = detect_gesture(frame)
    return jsonify({'gesture': player_choice})


@app.route('/start_game', methods=['POST'])
def start_game():
    """بدء اللعبة"""
    global cpu_choice, player_choice, winner, player_score, cpu_score
    cpu_choice = random.choice(cpu_choices)

    # حساب الفائز
    if player_choice == "Nothing":
        winner = "Invalid!"
    elif player_choice == cpu_choice:
        winner = "Tie!"
    elif (player_choice == "Rock" and cpu_choice == "Scissors") or \
         (player_choice == "Paper" and cpu_choice == "Rock") or \
         (player_choice == "Scissors" and cpu_choice == "Paper"):
        winner = "You win!"
        player_score += 1
    else:
        winner = "CPU wins!"
        cpu_score += 1

    return jsonify({
        'cpu_choice': cpu_choice,
        'player_choice': player_choice,
        'winner': winner,
        'player_score': player_score,
        'cpu_score': cpu_score
    })


@app.route('/reset_game', methods=['POST'])
def reset_game():
    """إعادة تعيين اللعبة"""
    global cpu_choice, player_choice, winner, player_score, cpu_score
    cpu_choice = "Nothing"
    player_choice = "Nothing"
    winner = "None"
    player_score = 0
    cpu_score = 0
    return jsonify({'status': 'reset'})


if __name__ == "__main__":
    app.run(debug=True)
