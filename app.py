import torch
from flask import Flask, render_template, jsonify, request
from transformers import AutoTokenizer, BlenderbotForConditionalGeneration, AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/send-message', methods=['POST'])
def send_message():
    user_message = request.json['message']
    
    mname = "facebook/blenderbot-400M-distill"
    model = BlenderbotForConditionalGeneration.from_pretrained(mname)
    tokenizer = AutoTokenizer.from_pretrained(mname)
    inputs = tokenizer([user_message], return_tensors="pt")
    reply_ids = model.generate(**inputs)

    response_text = tokenizer.batch_decode(reply_ids, skip_special_tokens=True)[0]
    

    return jsonify({"reply": response_text})


@app.route('/process-audio', methods=['POST'])
def process_audio():
    audio_file = request.files['audio']
    filename = 'user_audio.wav'
    audio_file.save(filename)

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model_id = "distil-whisper/distil-large-v2"

    model = AutoModelForSpeechSeq2Seq.from_pretrained(
        model_id, torch_dtype=torch_dtype, low_cpu_mem_usage=True, use_safetensors=True
    )
    model.to(device)

    processor = AutoProcessor.from_pretrained(model_id)

    pipe = pipeline(
        "automatic-speech-recognition",
        model=model,
        tokenizer=processor.tokenizer,
        feature_extractor=processor.feature_extractor,
        max_new_tokens=128,
        chunk_length_s=30,
        batch_size=16,
        return_timestamps=True,
        torch_dtype=torch_dtype,
        device=device,
    )

    result = pipe("user_audio.wav")

    return jsonify({"message": result["text"]})

if __name__ == '__main__':
    app.run(debug=True, port=5001)