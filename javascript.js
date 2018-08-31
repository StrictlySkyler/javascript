const name = 'javascript';
const pkgs = [];
const textarea_styles = `
  <style>
    .script-field {
      font-family: monospace;
      resize: vertical;
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
  <label>Script to execute:
    <textarea
      id=script-javascript
      name=script-javascript
      class="script-javascript script-field"
      placeholder="(() => 'Hello world')();"
      required
    >${values['script-javascript'] || ''}</textarea>
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

const update = (lane, values) => true;

const work = (lane, manifest) => {
  const script = manifest['script-javascript'];
  const shipment = Shipments.findOne(manifest.shipment_id)
  let exit_code = 0;
  let result;

  try {
    result = eval(script);
    shipment.stdout.push(result);
  } catch (e) {
    console.error(e);
    exit_code = 1;
    result = `${e.name}: ${e.message}`;
    shipment.stderr.push(result);
  }

  Shipments.update(shipment._id, shipment);
  H.end_shipment(lane, exit_code, manifest);
  return manifest;
};

module.exports = {
  render_input,
  render_work_preview,
  register,
  update,
  work,
};
