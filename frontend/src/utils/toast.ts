/**
 * 用户端统一弹窗工具。
 *
 * 背景：
 * - 项目用 Vant 4 + VantResolver，但 VantResolver 只对 <template> 中的组件自动
 *   引入样式，showToast / showDialog / showNotify 等命令式 API 不会带样式。
 *   所以这里手动 import 一次。
 * - 各页面原本散落了 showToast('文字') / showFailToast('文字') /
 *   showSuccessToast({...}) / showDialog({...}) 等风格，duration / forbidClick
 *   都没统一。统一封装在下面，所有调用点只暴露必要参数。
 */
import {
  showToast as vantShowToast,
  showSuccessToast as vantShowSuccess,
  showFailToast as vantShowFail,
  showDialog as vantShowDialog,
  showNotify as vantShowNotify,
  closeToast as vantCloseToast,
  type ToastOptions,
  type DialogOptions,
} from 'vant';

const DEFAULT_DURATION = 2500;
const DEFAULT_FORBID_CLICK = true;

/** 通用 toast — 通用提示默认 "fail" 类型（错误场景居多），需要成功反馈请用 successToast */
export function toast(message: string, opts?: Partial<ToastOptions>) {
  // 关闭 type=fail 的内置 X 图标(小尺寸下被识别成叹号)，改为纯文字条。
  // success/loading 等保留自己的视觉反馈(图标/转圈)。
  return vantShowToast({
    type: 'text',
    className: 'app-toast app-toast--text',
    duration: DEFAULT_DURATION,
    forbidClick: DEFAULT_FORBID_CLICK,
    message,
    ...opts,
  });
}

export function successToast(message: string, opts?: Partial<ToastOptions>) {
  return vantShowSuccess({
    duration: DEFAULT_DURATION,
    forbidClick: DEFAULT_FORBID_CLICK,
    message,
    ...opts,
  });
}

export function failToast(message: string, opts?: Partial<ToastOptions>) {
  // 错误反馈也只用文字,顶部不再叠红色"X/!"图标,通过 className 给提示文字上暖红
  return vantShowFail({
    icon: '',
    type: 'text',
    className: 'app-toast app-toast--fail',
    duration: DEFAULT_DURATION,
    forbidClick: DEFAULT_FORBID_CLICK,
    message,
    ...opts,
  });
}

export function loadingToast(message = '加载中…') {
  return vantShowToast({
    type: 'loading',
    duration: 0, // 0 表示不自动关闭
    forbidClick: true,
    message,
  });
}

export function closeToast() {
  vantCloseToast();
}

/** 顶部通知 */
export function notify(message: string, type: 'primary' | 'success' | 'warning' | 'danger' = 'primary') {
  return vantShowNotify({
    duration: DEFAULT_DURATION,
    type,
    message,
  });
}

/** 单按钮信息弹窗（无取消按钮，只有确认）— 通常用来显示"提示/说明" */
export function infoDialog(options: { title?: string; message: string; confirmText?: string }) {
  return vantShowDialog({
    title: options.title ?? '提示',
    message: options.message,
    confirmButtonText: options.confirmText ?? '我知道了',
    showCancelButton: false,
  });
}

/** 二次确认弹窗 — 返回 Promise<boolean>，true=确认，false=取消/关闭 */
export function confirmDialog(options: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    vantShowDialog({
      title: options.title ?? '确认',
      message: options.message,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? '确认',
      cancelButtonText: options.cancelText ?? '取消',
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

/** 异步操作进度：自动展示 loading，结束关闭；错误时弹出 failToast
 *  用法：const data = await withLoading(() => api(), '提交中') */
export async function withLoading<T>(
  task: () => Promise<T>,
  loadingText = '加载中…',
  onError?: (err: unknown) => void,
): Promise<T | undefined> {
  loadingToast(loadingText);
  try {
    const result = await task();
    closeToast();
    return result;
  } catch (err) {
    closeToast();
    if (onError) onError(err);
    else failToast('操作失败，请稍后再试');
    return undefined;
  }
}

// 兼容以前的 DialogConfirmAction 引用（以后别处用得到）
export type { DialogOptions };
