const name = 'javascript';
const pkgs = [];
const textarea_styles = `
  <style>
    .script-field {
      font-family: monospace;
      resize: vertical;
    }

    #disable-editor {
      display: none;
    }
  </style>
`;
const resize_textarea_script_tag = `
  <script>
    $text = $('#script-javascript');
    $text.on('input', function () {
      this.style.height = this.scrollHeight + 'px';
    }).css('height', $text[0].scrollHeight + 10 + 'px');
  </script>
`;
let Shipments;

const render_input = (values = {}) => `
  ${textarea_styles}
  ${resize_textarea_script_tag}
  <button id=enable-editor class="button hollow">
    Enable Rich Editor
  </button>
  <button id=disable-editor class="button hollow">
    Disable Rich Editor
  </button>
  <label>Script to execute:
    <textarea
      id=script-javascript
      name=script-javascript
      class="script-javascript script-field"
      placeholder="(() => 'Hello world')();"
      required
    >${values['script-javascript'] || ''}</textarea>
    <div id=rich-editor></div>
  </label>
`;

const render_work_preview = (manifest) => `
  ${textarea_styles}
  ${resize_textarea_script_tag}
  <figure>
    <figcaption>The following script will be executed:</figcaption>
    <textarea
      id=script-javascript
      class="script-javascript script-field"
      disabled
    >${manifest['script-javascript']}</textarea>
  </figure>
`;

const register = (lanes, users, harbors, shipments) => {
  Shipments = shipments;
  return { name, pkgs };
};

const update = (lane, values) => {
  console.log(`No validation performed for lane ${lane} with values ${values}`);
  return true;
};

const work = (lane, manifest) => {
  const script = manifest['script-javascript'];
  const shipment = Shipments.findOne(manifest.shipment_id);
  let exit_code = 0;
  let result;

  try {
    result = eval(script);
    shipment.stdout.push(result);
  }
  catch (e) {
    console.error(e);
    exit_code = 1;
    result = `${e.name}: ${e.message}`;
    shipment.stderr.push(result);
  }

  Shipments.update(shipment._id, shipment);
  H.end_shipment(lane, exit_code, manifest);
  return manifest;
};

const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.40.0/';
const codemirror_script_url = `${cdn}codemirror.min.js`;
const codemirror_style_url = `${cdn}codemirror.min.css`;
const codemirror_theme_url = `${cdn}theme/solarized.min.css`;
const codemirror_mode_url = `${cdn}mode/javascript/javascript.min.js`;

const event_handlers = () => {
  let code;
  const enable_editor = document.getElementById('enable-editor');
  if (! enable_editor) return;

  const form = enable_editor.closest('form');
  form.addEventListener('click', (e) => {
    if (e.target.id == 'enable-editor') {
      e.preventDefault();
      e.target.style.display = 'none';
      document.getElementById('disable-editor').style.display = 'block';
      return code = CodeMirror.fromTextArea(
        document.getElementById('script-javascript'),
        {
          lineNumbers: true,
          tabSize: 2,
          mode: 'javascript',
          theme: 'solarized',
        }
      );
    }

    if (e.target.id == 'disable-editor') {
      e.preventDefault();
      e.target.style.display = 'none';
      document.getElementById('enable-editor').style.display = 'block';
      return code.toTextArea();
    }

    return true;
  });
};

constraints = () => ({
  global: [],
  edit_lane: [
    {
      id: 'codemirror',
      src: codemirror_script_url,
    },
    {
      id: 'codemirror-mode',
      src: codemirror_mode_url,
    },
    {
      rel: 'stylesheet',
      id: 'codemirror-style',
      href: codemirror_style_url,
    },
    {
      rel: 'stylesheet',
      id: 'codemirror-theme',
      href: codemirror_theme_url,
    },
    {
      id: 'codemirror-init',
      text: `(${(event_handlers.toString())})();`
    },
  ],
});

module.exports = {
  render_input,
  render_work_preview,
  register,
  update,
  work,
  constraints,
};
