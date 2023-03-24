import os 
os.environ['TF_CPP_MIN_LOG_LEVEL']='2'

#This imports the NLTK library and the LancasterStemmer algorithm for stemming (reducing words to their root form) words.
import nltk
from nltk.stem.porter import PorterStemmer
stemmer = PorterStemmer()

import numpy as np
import tflearn
import tensorflow
import random
import json
import pickle

with open("intents.json") as file:
    data = json.load(file)

# We are using the pickle to store the trained model so that we does not need to retrain it every time the code gets executed.
try:
    with open("data.pickle","rb") as f:
        words, labels, training, output=pickle.load(f)
except:   
    words = []
    labels = []
    docs_x = []
    docs_y = []

    # Preprocessing the data by tokenizing, stemming and creating a bag of words for each sentence
    for intent in data["intents"]:
        for pattern in intent["patterns"]:
            wrds = nltk.word_tokenize(pattern)
            words.extend(wrds)
            docs_x.append(wrds)
            docs_y.append(intent["tag"])

        if intent["tag"] not in labels:
            labels.append(intent["tag"])

    words = [stemmer.stem(w.lower()) for w in words if w != "?"]
    words = sorted(list(set(words)))

    labels = sorted(labels)

    training = []
    output = []

    out_empty = [0 for _ in range(len(labels))]

    # For each sentence in the documents, create a bag of words and the corresponding output
    for x, doc in enumerate(docs_x):
        bag = []

        wrds = [stemmer.stem(w.lower()) for w in doc]

        for w in words:
            if w in wrds:
                bag.append(1)
            else:
                bag.append(0)

        output_row = out_empty[:]
        output_row[labels.index(docs_y[x])] = 1

        training.append(bag)
        output.append(output_row)

# Convert the training and the output data in the numpy arrays
training = np.array(training)
output = np.array(output)

# Save the preprocessed data to a file 
with open("data.pickle","wb") as f:
    pickle.dump((words, labels, training, output),f)

# This creates a neural network with 3 hidden layers and a softmax activation function for the output layer.
net = tflearn.input_data(shape=[None, len(training[0])])
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, 8)
net = tflearn.fully_connected(net, len(output[0]), activation="softmax")
net = tflearn.regression(net)
 
model = tflearn.DNN(net)

# Try to load the trained model if not trained then first it will train the model and then save the model and the load it.
try:
    model.load("model.tflearn") 
except:
    model.fit(training, output, n_epoch=1000, batch_size=8, show_metric=True)
    model.save("model.tflearn")


""" return bag of words array: 1 for each known word that exists in the sentence, 0 otherwise
    example:
    sentence = ["hello", "how", "are", "you"]
    words = ["hi", "hello", "I", "you", "bye", "thank", "cool"]
    bag   = [  0 ,    1 ,    0 ,   1 ,    0 ,    0 ,      0] """

def bag_of_words(sentence, words):
    bag=[0 for _ in range(len(words))]
    sen_words=nltk.word_tokenize(sentence)
    sen_words=[stemmer.stem(word.lower()) for word in sen_words]
    for sentence in sen_words:
        for i, wds in enumerate(words):
            if wds==sentence:
                bag[i]=1
    return np.array(bag)

# This method will return the response to a inputted sentence by the user by prediction based on the trained model.
def get_response(msg):
    results= model.predict([bag_of_words(msg, words)])[0] 
    results_index=np.argmax(results)
    tag= labels[results_index]
    if results[results_index]> 0.9:
        for tg in data["intents"]:
            if tg['tag']==tag:
                responses=tg['responses']
                return random.choice(responses)
    return "I didn't understand, please try again."

# This is the main  method of the program used to take the input from the user and giving response to user.
if __name__ == "__main__":
    print("Let's chat! (type 'quit' to exit)")
    while True:
        sentence = input("You: ")
        if sentence == "quit":
            break

        resp = get_response(sentence)
        print(resp)    