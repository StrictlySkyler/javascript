const name = 'javascript';
const pkgs = [];
const textarea_styles = /*html*/`
  <style>
    .script-field {
      font-family: monospace;
      resize: vertical;
      white-space: break-spaces;
    }

    #disable-rich-editor {
      display: none;
    }
  </style>
`;
const resize_textarea_script_tag = /*html*/`
  <script>
    (function () {

      const $text = $('#script-javascript');
      $text.on('input', function () {
        this.style.height = this.scrollHeight + 'px';
      }).css('height', $text[0].scrollHeight + 10 + 'px');
    })();
  </script>
`;
let Shipments;

const render_input = (values = {}) => /*html*/`
  ${textarea_styles}
  ${resize_textarea_script_tag}
  <button id=enable-rich-editor class="enable-rich-editor harbor-button">
    Enable Rich Editor
  </button>
  <button id=disable-rich-editor class="disable-rich-editor harbor-button">
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

const render_work_preview = (manifest) => /*html*/`
  ${textarea_styles}
  ${resize_textarea_script_tag}
  <figure>
    <figcaption>The following script will be executed:</figcaption>
    <code
      id=script-javascript
      class="script-javascript script-field"
      disabled
    >${manifest['script-javascript']}</code>
  </figure>
`;

const register = (lanes, users, harbors, shipments) => {
  Shipments = shipments;
  return { name, pkgs };
};

const update = (lane, value) => {
  console.log(
    `No validation performed for lane "${lane.name}" with value: `, 
    value
  );
  return true;
};

const work = (lane, manifest) => {
  const script = manifest['script-javascript'];
  const shipment = Shipments.findOne(manifest.shipment_id);
  let exit_code = 0;
  let result;
  let key = new Date();

  try {
    result = eval(script);
    shipment.stdout[key] = result;
  }
  catch (e) {
    console.error(e);
    exit_code = 1;
    result = `${e.name}: ${e.message}`;
    shipment.stderr[key] = result;
  }

  if (!result) exit_code = 1;

  Shipments.update(shipment._id, shipment);
  H.end_shipment(lane, exit_code, manifest);
  return manifest;
};

const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.61.0/';
const codemirror_script_url = `${cdn}codemirror.min.js`;
const codemirror_style_url = `${cdn}codemirror.min.css`;
const codemirror_theme_url = `${cdn}theme/solarized.min.css`;
const codemirror_mode_url = `${cdn}mode/javascript/javascript.min.js`;

const event_handlers = () => {
  let code;

  document.addEventListener('click', (e) => {
    if (e.target.id == 'enable-rich-editor') {
      e.preventDefault();
      e.target.style.display = 'none';
      document.getElementById('disable-rich-editor').style.display = 'block';
      code = CodeMirror.fromTextArea(
        document.getElementById('script-javascript'),
        {
          lineNumbers: true,
          tabSize: 2,
          mode: 'javascript',
          theme: 'solarized dark',
        }
      );
      return code;
    }

    if (e.target.id == 'disable-rich-editor') {
      e.preventDefault();
      e.target.style.display = 'none';
      document.getElementById('enable-rich-editor').style.display = 'block';
      code.toTextArea();
      code = null;
      return code;
    }

    if (
      e.target.id == 'harbor-save-button' 
      && document.getElementById('disable-rich-editor')
    ) {
      document.getElementById('enable-rich-editor').style.display = 'block';
      document.getElementById('disable-rich-editor').style.display = 'none';
      code.toTextArea();
      code = null;
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
