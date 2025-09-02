import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="fill-current text-white dark:text-black"/>
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="mb-0.5 truncate leading-tight font-bold text-2xl">Curl Xer</span>
            </div>
        </>
    );
}
