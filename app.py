from flask import Flask, render_template, request, jsonify,session
from flask_cors import CORS
from model import get_response 
from flask_session import Session
from datetime import datetime
import uuid
import time 

import random
import smtplib
from email.mime.text import MIMEText

app= Flask(__name__)
app.secret_key = 'my_secret_key'
cors= CORS(app)

import mysql.connector
from flask_mysqldb import MySQL

app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_FILE_THRESHOLD'] = 1000
Session(app)

 
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'kmsbot'
 
mysql = MySQL(app)

# This will redirect us to our user info submission page 
@app.get("/")
def info_get():
    return render_template("info.html")


# To store the user data into the database 
@app.route('/user_info', methods=['POST'])
def user_info():
    data=request.get_json()
    name=data['name']
    email=data['email']
    phone=data['phone']
    cursor=mysql.connection.cursor()
    try:
        cursor.execute("SELECT * FROM user_info WHERE email=%s", (email,))
        user = cursor.fetchone()
        if user:
            # Update the existing record
            cursor.execute("UPDATE user_info SET name=%s, phone=%s WHERE email=%s", (name, phone, email))
            userId=user[0]
        else:
            userId=str(uuid.uuid4())
            sql = "INSERT INTO user_info(userId,name, email, phone) VALUES (%s,%s, %s, %s)"
            val = (userId,name, email, phone)
            cursor.execute(sql,val)
        mysql.connection.commit()
        
        cursor.execute("SELECT userId FROM user_info WHERE email=%s", (email,))
        userId = cursor.fetchone()[0]

        sessionId=str(uuid.uuid4())
        cursor.execute("INSERT INTO session_info(userId,sessionId, start_time) VALUES (%s,%s, NOW())", (userId,sessionId))
        mysql.connection.commit()
        session['sessionId'] = sessionId
        session['userId']=userId

    except Exception as e:
        print("Error executing SQL query:", e)
        mysql.connection.rollback()
    finally:
        cursor.close()
    session['name'] = name
    session['email'] = email
    session['phone'] = phone
    return jsonify({'success': True})


# This is for sending the otp to the email entered by the user for the authentication of email
@app.post("/send_otp_email")
def send_otp_email():
    user_email=request.json['email']
    # generate a 6-digit OTP

    otp = random.randint(100000, 999999)
    session['otp'] = {'value': otp, 'timestamp': time.time()}
    session.modified=True
    # set up email message
    message = MIMEText(f'Your OTP is {otp}. This otp is valid for only 2 minutes.')
    message['From'] = 'vp629393@gmail.com'
    message['To'] = user_email
    message['Subject'] = 'OTP verification'

    # send email using SMTP server
    with smtplib.SMTP('smtp.gmail.com', 587) as smtp_server:
        smtp_server.ehlo()
        smtp_server.starttls()
        smtp_server.ehlo()
        smtp_server.login('vp629393@gmail.com', 'qnooegwbaidkwgup')
        smtp_server.sendmail('vp629393@gmail.com', user_email, message.as_string())

    return str(otp)


# This is used for the otp verification for the email enterd by the user 
@app.post("/verify_otp")
def verify_otp():
    user_otp = request.json['otp']
    generated_otp = session.get('otp') # retrieve the generated OTP from session
    if generated_otp is None:
        message = "OTP verification failed!"
        return jsonify({'status': 'failure', 'message': message})
    if time.time() - generated_otp['timestamp'] > 120:
        message = "OTP expired!"
        return jsonify({'status': 'failure', 'message': message})
    if user_otp == str(generated_otp['value']):
        message = "OTP verified successfully!"
        return jsonify({'status': 'success', 'message': message})
    else:
        message = "OTP verification failed!"
        return jsonify({'status': 'failure', 'message': message})

# This is used for taking the user input and giving response to the user by prediction based on the model training
@app.post("/predict")
def predict():
    text=request.get_json().get("message")
    response= get_response(text)
    message={"answer": response}
    userId = session.get('userId')
    sessionId = session.get('sessionId')
    msgId=str(uuid.uuid4())
    user_message = text
    bot_response = response
    timestamp = datetime.now()

    cursor = mysql.connection.cursor()
    try:
        sql = "INSERT INTO chat_info(msgId,sessionid, userId,user_message, bot_response, timestamp) VALUES (%s, %s, %s, %s,%s,%s)"
        val = (msgId,sessionId,userId, user_message, bot_response, timestamp)
        cursor.execute(sql, val)
        mysql.connection.commit()
    except Exception as e:
        print("Error executing SQL query:", e)
        mysql.connection.rollback()
    finally:
        cursor.close()

    return jsonify(message)

if __name__=="__main__":
  app.run(debug=True)