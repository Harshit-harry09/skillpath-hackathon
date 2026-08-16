---
language: en
license: apache-2.0
tags:
- resume-parsing
- named-entity-recognition
- ner
- bert
- information-extraction
- cv-parser
- token-classification
datasets:
- resume-corpus
- dataturks-resume-ner
- custom-training-data
metrics:
- f1
- precision
- recall
---

# Resume NER BERT v2 - Advanced Resume Information Extraction

A state-of-the-art Named Entity Recognition (NER) model specifically designed for extracting structured information from resumes and CVs. This model achieves **90.87% F1 score** and is trained on a comprehensive dataset of **22,542 resume samples** from multiple sources.

## 🎯 Model Description

This model has been extensively fine-tuned to extract key information from resumes including personal details, contact information, work experience, education, skills, and more. The model uses a BERT-based architecture with token classification capabilities, making it highly effective for resume parsing tasks.

### Key Features:
- **High Accuracy**: 90.87% F1 score on comprehensive resume parsing
- **Comprehensive Coverage**: 25 entity types covering all major resume sections
- **Large Training Dataset**: 22,542 samples from multiple sources
- **Production Ready**: Tested and optimized for real-world applications
- **Memory Efficient**: CPU-optimized with reasonable model size (431MB)

## 📊 Performance Metrics

| Metric | Score | Status |
|--------|-------|--------|
| **F1 Score** | **90.87%** | ✅ Excellent |
| **Precision** | 91.44% | ✅ High |
| **Recall** | 90.81% | ✅ High |
| **Training Loss** | 0.2604 | ✅ Low |

## 🏷️ Label Schema

The model recognizes **25 entity types** using BIO (Beginning-Inside-Outside) tagging:

### Core Personal Information:
- **Name**: Person's full name (e.g., "John Smith", "Sarah Johnson")
- **Email Address**: Email contact information (e.g., "john.smith@gmail.com")
- **Phone**: Phone number (e.g., "(555) 123-4567", "+1-555-123-4567")
- **Location**: Geographic location (e.g., "San Francisco, CA", "New York")

### Professional Information:
- **Companies worked at**: Previous employers and organizations (e.g., "Google", "Microsoft", "Amazon")
- **Designation**: Job titles and roles (e.g., "Senior Software Engineer", "Data Scientist", "Marketing Manager")
- **Skills**: Technical and soft skills (e.g., "Python", "JavaScript", "Machine Learning", "Leadership")
- **Years of Experience**: Work experience duration (e.g., "5 years", "10+ years")

### Educational Information:
- **Degree**: Educational qualifications (e.g., "Bachelor's in Computer Science", "Master's in Data Science")
- **College Name**: Educational institutions (e.g., "Stanford University", "MIT", "Harvard")
- **Graduation Year**: Year of degree completion (e.g., "2020", "2018")

### Additional:
- **UNKNOWN**: Unclassified entities that don't fit other categories

### BIO Tags:
- `B-` (Beginning): Start of an entity
- `I-` (Inside): Continuation of an entity
- `O` (Outside): Non-entity tokens

## 🚀 Usage

### Using the Model Directly

```python
from transformers import AutoTokenizer, AutoModelForTokenClassification
import torch

# Load model and tokenizer
model_name = "yashpwr/resume-ner-bert-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)

# Example resume text
text = "John Smith is a senior software engineer with 8 years of experience at Google. He has expertise in Python, JavaScript, and machine learning. Contact: john.smith@gmail.com"

# Tokenize
inputs = tokenizer(
    text,
    return_tensors="pt",
    truncation=True,
    max_length=128,
    padding=True
)

# Predict
with torch.no_grad():
    outputs = model(**inputs)
    predictions = torch.argmax(outputs.logits, dim=2)

# Extract entities
entities = []
current_entity = None

for i, pred in enumerate(predictions[0]):
    label = model.config.id2label[pred.item()]
    token = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0][i])
    
    if label.startswith('B-'):
        if current_entity:
            entities.append(current_entity)
        current_entity = {
            'text': token,
            'label': label[2:],  # Remove 'B-' prefix
            'start': i
        }
    elif label.startswith('I-') and current_entity:
        current_entity['text'] += ' ' + token
    elif label == 'O':
        if current_entity:
            entities.append(current_entity)
            current_entity = None

if current_entity:
    entities.append(current_entity)

print("Extracted Entities:")
for entity in entities:
    print(f"- {entity['label']}: {entity['text']}")
```

### Using the Pipeline

```python
from transformers import pipeline

# Create NER pipeline
ner_pipeline = pipeline(
    "token-classification",
    model="yashpwr/resume-ner-bert-v2",
    aggregation_strategy="simple"
)

# Extract entities
text = "Sarah Johnson holds a Master's degree in Computer Science from Stanford University. Skills: Python, TensorFlow, SQL."
results = ner_pipeline(text)

for entity in results:
    print(f"{entity['entity_group']}: {entity['word']} (confidence: {entity['score']:.3f})")
```

### Advanced Usage with Confidence Scores

```python
from transformers import AutoTokenizer, AutoModelForTokenClassification
import torch
import numpy as np

# Load model
model_name = "yashpwr/resume-ner-bert-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForTokenClassification.from_pretrained(model_name)

def extract_entities_with_confidence(text, confidence_threshold=0.5):
    """Extract entities with confidence scores."""
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True,
        return_offsets_mapping=True
    )
    
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.argmax(outputs.logits, dim=2)
        probabilities = torch.softmax(outputs.logits, dim=2)
    
    entities = []
    current_entity = None
    offset_mapping = inputs.offset_mapping[0]
    
    for i, (pred, offset) in enumerate(zip(predictions[0], offset_mapping)):
        label = model.config.id2label[pred.item()]
        confidence = probabilities[0][i][pred].item()
        
        # Skip special tokens
        if offset[0] == 0 and offset[1] == 0:
            continue
        
        if label.startswith('B-'):
            if current_entity and current_entity['confidence'] >= confidence_threshold:
                entities.append(current_entity)
            
            entity_type = label[2:]
            current_entity = {
                'text': text[offset[0]:offset[1]],
                'label': entity_type,
                'start': offset[0],
                'end': offset[1],
                'confidence': confidence
            }
        
        elif label.startswith('I-') and current_entity:
            entity_type = label[2:]
            if entity_type == current_entity['label']:
                current_entity['text'] += ' ' + text[offset[0]:offset[1]]
                current_entity['end'] = offset[1]
                current_entity['confidence'] = min(current_entity['confidence'], confidence)
        
        elif label == 'O':
            if current_entity and current_entity['confidence'] >= confidence_threshold:
                entities.append(current_entity)
                current_entity = None
    
    if current_entity and current_entity['confidence'] >= confidence_threshold:
        entities.append(current_entity)
    
    return entities

# Example usage
text = "Michael Brown is a marketing manager with 10 years of experience at Coca-Cola. Contact: michael.brown@marketing.com"
entities = extract_entities_with_confidence(text, confidence_threshold=0.3)

for entity in entities:
    print(f"{entity['label']}: '{entity['text']}' (confidence: {entity['confidence']:.3f})")
```

## 📚 Training Details

### Dataset Composition
- **Total Samples**: 22,542
- **Sources**:
  - **Resume-Corpus Dataset**: 349 samples (structured resume data)
  - **DataTurks Resume NER**: 420 samples (manually annotated resumes)
  - **Custom Training Data**: 21,773 samples (rule-based extraction from conversation data)
  - **Mehyaar Skills Dataset**: Integrated skills-focused data

### Training Configuration
- **Base Model**: `yashpwr/resume-ner-bert`
- **Learning Rate**: 3e-5
- **Batch Size**: 4 (effective: 32 with gradient accumulation)
- **Max Sequence Length**: 128 tokens
- **Epochs**: 1.0 (early stopping applied)
- **Device**: CPU (optimized for memory efficiency)
- **Gradient Accumulation Steps**: 8
- **Optimizer**: AdamW
- **Loss Function**: Cross-Entropy Loss

### Training Process Improvements
The model was trained using a comprehensive pipeline that addressed several key challenges:

1. **✅ Tokenization Consistency**: Used `bert-base-cased` throughout the pipeline to ensure consistent tokenization between training and inference
2. **✅ Entity Extraction Enhancement**: Implemented proper character-to-token alignment using `return_offsets_mapping=True` for accurate text reconstruction
3. **✅ Label Mapping**: Unified diverse label schemas into the DataTurks format (25 labels) for consistency
4. **✅ Performance Optimization**: CPU-optimized training with memory efficiency and gradient accumulation
5. **✅ Dataset Integration**: Successfully integrated 21,773 additional samples from conversation data using rule-based extraction

## 🎯 Use Cases

### Primary Applications
- **Recruitment Platforms**: Automated resume parsing and candidate screening
- **Resume Parsing Engines**: Extract structured data from unstructured resumes
- **Talent Analytics Tools**: Analyze candidate skills and experience patterns
- **Document Processing Pipelines**: Integrate with HR systems and ATS
- **ATS (Applicant Tracking Systems)**: Automated candidate data extraction and categorization

### Industry Sectors
- **Human Resources & Recruitment**: Streamline hiring processes
- **Technology & Software Development**: Technical skill assessment
- **Finance & Banking**: Compliance and background verification
- **Healthcare**: Medical credential verification
- **Education**: Academic credential processing
- **Government & Public Sector**: Public service recruitment

### Specific Use Cases
1. **Automated Resume Screening**: Filter candidates based on skills and experience
2. **Data Migration**: Convert legacy resume databases to structured formats
3. **Compliance Checking**: Verify educational and professional credentials
4. **Skill Gap Analysis**: Identify missing skills in candidate pools
5. **Market Research**: Analyze job market trends and skill demands

## ⚠️ Limitations

1. **Language**: Currently optimized for English resumes only
2. **Format**: Works best with text-based resumes (PDF conversion may be required)
3. **Domain**: Primarily trained on technology and business resumes
4. **Length**: Optimal for resumes under 512 tokens (truncation applied for longer texts)
5. **Accuracy**: 90.87% F1 score - may miss some entities in complex or non-standard formats
6. **Context**: Limited to resume-specific entities (not general NER)

## 🔧 Technical Requirements

### System Requirements
- **Python**: 3.8 or higher
- **PyTorch**: 1.9 or higher
- **Transformers**: 4.20 or higher
- **Memory**: 2GB+ RAM recommended
- **Storage**: 431MB model size
- **CPU**: Multi-core recommended for inference

### Dependencies
```bash
pip install transformers torch datasets scikit-learn numpy
```

### Installation
```bash
# Install required packages
pip install transformers[torch] datasets scikit-learn

# Or using conda
conda install pytorch transformers -c pytorch
```

## 📄 License

This model is licensed under the Apache 2.0 License. This means you can:
- Use the model for commercial purposes
- Modify and distribute the model
- Use it in proprietary software
- Distribute modified versions

See the [LICENSE](LICENSE) file for complete details.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can contribute:

1. **Report Issues**: Create an issue for bugs or feature requests
2. **Submit Improvements**: Fork the repository and submit pull requests
3. **Share Datasets**: Contribute additional training data
4. **Documentation**: Help improve documentation and examples
5. **Testing**: Test the model on different resume formats

## 📞 Support

For questions, issues, or support:

- **GitHub Issues**: Create an issue on the model repository
- **Hugging Face Discussions**: Use the discussion tab on the model page
- **Email**: Contact through the Hugging Face profile
- **Documentation**: Check the model card and examples

## 🙏 Acknowledgments

- **Base Model**: `yashpwr/resume-ner-bert` for the foundation architecture
- **Datasets**: Resume-Corpus, DataTurks, and custom training data contributors
- **Hugging Face**: For the transformers library and platform
- **Open Source Community**: For contributions and feedback
- **Research Community**: For advancing NER and information extraction techniques

## 📈 Model Evolution

### Version History
- **v1**: Initial release with basic resume parsing
- **v2**: Comprehensive model with 22,542 samples and 90.87% F1 score

### Future Improvements
- Multi-language support
- Enhanced entity types
- Better handling of complex resume formats
- Integration with document processing pipelines
- Real-time inference optimization

---

**Last Updated**: August 7, 2025  
**Version**: v2  
**Status**: Production Ready ✅  
**License**: Apache 2.0  
**Repository**: https://huggingface.co/yashpwr/resume-ner-bert-v2 