/**
 * Tool Renderer
 * -------------
 * Builds the interactive UI for ANY tool from its spec. One renderer,
 * every tool. Live-updating: results recalculate on each keystroke,
 * with no submit button and no network request.
 */
(function () {
  'use strict';

  const fmt = {
    number(v, unit) {
      if (v === null || v === undefined || v === '') return '—';
      if (typeof v === 'string') return v;
      if (!isFinite(v)) return v > 0 ? '∞' : (isNaN(v) ? '—' : '−∞');
      const abs = Math.abs(v);
      let s;
      if (abs !== 0 && (abs < 1e-4 || abs >= 1e12)) s = v.toExponential(6);
      else {
        const dp = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
        s = Number(v.toFixed(dp)).toLocaleString('en-US', { maximumFractionDigits: dp });
      }
      return unit ? `${s} ${unit}` : s;
    },
    currency(v) {
      if (!isFinite(v)) return '—';
      return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
    },
    percent(v) { return isFinite(v) ? `${Number(v.toFixed(4)).toLocaleString('en-US')}%` : '—'; },
    text(v) { return v === null || v === undefined ? '' : String(v); },
    auto(v, unit) { return typeof v === 'string' ? v : fmt.number(v, unit); }
  };

  function buildInput(input) {
    const id = `in-${input.key}`;
    const wrap = document.createElement('div');
    wrap.className = 'field';

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = input.label + (input.unit ? ` (${input.unit})` : '');
    wrap.appendChild(label);

    let el;
    if (input.type === 'select') {
      el = document.createElement('select');
      input.options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value; opt.textContent = o.label;
        if (String(o.value) === String(input.default)) opt.selected = true;
        el.appendChild(opt);
      });
    } else {
      el = document.createElement('input');
      el.type = input.type === 'date' ? 'date' : input.type === 'text' ? 'text' : 'number';
      if (input.type === 'number') {
        el.step = input.step || 'any';
        el.inputMode = 'decimal';
        if (input.min !== undefined) el.min = input.min;
      }
      let def = input.default;
      if (def === 'TODAY') def = new Date().toISOString().slice(0, 10);
      if (def !== null && def !== undefined) el.value = def;
      if (input.optional) el.placeholder = 'leave blank to solve for this';
    }
    el.id = id;
    el.name = input.key;
    el.className = 'control';
    wrap.appendChild(el);
    return wrap;
  }

  function readValues(spec, form) {
    const vals = {};
    spec.inputs.forEach(inp => {
      const el = form.querySelector(`[name="${inp.key}"]`);
      if (!el) return;
      if (inp.type === 'number') {
        vals[inp.key] = el.value === '' ? null : Number(el.value);
      } else {
        vals[inp.key] = el.value;
      }
    });
    return vals;
  }

  function renderResults(spec, results, container) {
    container.innerHTML = '';
    spec.outputs.forEach(out => {
      const v = results[out.key];
      if (v === undefined) return;
      if (out.format === 'text' && (v === '' || v === null)) return;

      const row = document.createElement('div');
      row.className = 'result' + (out.primary ? ' result-primary' : '');

      if (out.label) {
        const l = document.createElement('span');
        l.className = 'result-label';
        l.textContent = out.label;
        row.appendChild(l);
      }

      const val = document.createElement('span');
      val.className = 'result-value';
      const f = fmt[out.format] || fmt.number;
      val.textContent = f(v, out.unit);
      row.appendChild(val);

      const copy = document.createElement('button');
      copy.className = 'copy';
      copy.type = 'button';
      copy.title = 'Copy value';
      copy.textContent = '⧉';
      copy.addEventListener('click', () => {
        navigator.clipboard?.writeText(val.textContent).then(() => {
          copy.textContent = '✓';
          setTimeout(() => (copy.textContent = '⧉'), 1200);
        });
      });
      row.appendChild(copy);

      container.appendChild(row);
    });
  }

  window.MVRTool = {
    mount(spec, root) {
      const form = root.querySelector('.tool-form');
      const out = root.querySelector('.tool-results');

      spec.inputs.forEach(inp => form.appendChild(buildInput(inp)));

      const run = () => {
        try {
          renderResults(spec, spec.compute(readValues(spec, form)) || {}, out);
        } catch (e) {
          out.innerHTML = '<div class="result"><span class="result-label">Error</span>' +
                          '<span class="result-value">Check your inputs</span></div>';
        }
      };

      form.addEventListener('input', run);
      form.addEventListener('change', run);
      run();
    },

    mountConverter(dim, dimData, convert, root, preset) {
      const form = root.querySelector('.tool-form');
      const out = root.querySelector('.tool-results');
      const keys = Object.keys(dimData.units);

      const mk = (key, label, def) => {
        const w = document.createElement('div');
        w.className = 'field';
        const l = document.createElement('label');
        l.setAttribute('for', 'u-' + key); l.textContent = label;
        const s = document.createElement('select');
        s.id = 'u-' + key; s.name = key; s.className = 'control';
        keys.forEach(k => {
          const o = document.createElement('option');
          o.value = k; o.textContent = `${dimData.units[k].name} (${dimData.units[k].symbol})`;
          if (k === def) o.selected = true;
          s.appendChild(o);
        });
        w.appendChild(l); w.appendChild(s);
        return w;
      };

      const vw = document.createElement('div');
      vw.className = 'field';
      vw.innerHTML = '<label for="u-value">Value</label>';
      const vi = document.createElement('input');
      vi.id = 'u-value'; vi.type = 'number'; vi.step = 'any';
      vi.inputMode = 'decimal'; vi.className = 'control'; vi.value = '1';
      vw.appendChild(vi);

      form.appendChild(vw);
      form.appendChild(mk('from', 'From', preset?.from || keys[0]));
      form.appendChild(mk('to', 'To', preset?.to || keys[1]));

      const swap = document.createElement('button');
      swap.type = 'button'; swap.className = 'swap'; swap.textContent = '⇅ Swap units';
      form.appendChild(swap);

      const run = () => {
        const v = vi.value === '' ? null : Number(vi.value);
        const f = form.querySelector('[name="from"]').value;
        const t = form.querySelector('[name="to"]').value;
        out.innerHTML = '';

        if (v === null) return;

        const main = document.createElement('div');
        main.className = 'result result-primary';
        main.innerHTML =
          `<span class="result-label">${fmt.number(v)} ${dimData.units[f].symbol} =</span>` +
          `<span class="result-value">${fmt.number(convert(v, f, t, dim))} ${dimData.units[t].symbol}</span>`;
        out.appendChild(main);

        const tbl = document.createElement('div');
        tbl.className = 'all-units';
        tbl.innerHTML = '<h3>All units</h3>';
        keys.forEach(k => {
          if (k === f) return;
          const row = document.createElement('div');
          row.className = 'result';
          row.innerHTML =
            `<span class="result-label">${dimData.units[k].name}</span>` +
            `<span class="result-value">${fmt.number(convert(v, f, k, dim))} ${dimData.units[k].symbol}</span>`;
          tbl.appendChild(row);
        });
        out.appendChild(tbl);
      };

      swap.addEventListener('click', () => {
        const fs = form.querySelector('[name="from"]');
        const ts = form.querySelector('[name="to"]');
        [fs.value, ts.value] = [ts.value, fs.value];
        run();
      });

      form.addEventListener('input', run);
      form.addEventListener('change', run);
      run();
    }
  };
})();
